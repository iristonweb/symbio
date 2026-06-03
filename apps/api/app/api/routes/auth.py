from datetime import datetime, timezone

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status  # noqa: F401 Query used
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_current_user_optional, get_db
from app.core.rbac import user_capabilities
from app.core.security import hash_password, verify_password, create_access_token
from app.db.crud import users as users_crud
from app.db.crud import auth_tokens as tokens_crud
from app.db.crud import referrals as referrals_crud
from app.db.crud.audit import add_audit
from app.db.models.user import User
from app.services.email_service import send_email, verification_email_link
from app.services.nickname import sanitize_nickname
from app.services import oauth_service
from app.services import steam_library

router = APIRouter()


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    nickname: str | None = None
    auto_nickname: bool = True
    referral_code: str | None = None


class LoginIn(BaseModel):
    # Dev accounts may use .local / reserved TLDs — do not use EmailStr here.
    username: str = Field(min_length=3, max_length=320)
    password: str


class ProfileUpdateIn(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    locale: str | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    nickname: str
    display_name: str | None
    avatar_url: str | None
    bio: str | None
    locale: str
    email_verified: bool
    roles: list[str]
    capabilities: list[str]


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        email=user.email,
        nickname=user.nickname,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        bio=user.bio,
        locale=user.locale,
        email_verified=user.email_verified,
        roles=user.roles or ["user"],
        capabilities=sorted(user_capabilities(user)),
    )


def _issue_token(user: User) -> TokenOut:
    return TokenOut(access_token=create_access_token(subject=user.email, roles=user.roles or ["user"]))


@router.post("/register", response_model=TokenOut)
async def register(payload: RegisterIn, db: AsyncSession = Depends(get_db)):
    existing = await users_crud.get_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    nick = None if payload.auto_nickname and not payload.nickname else payload.nickname
    if nick:
        nick = sanitize_nickname(nick)
    user = await users_crud.create_user(
        db,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        roles=["user"],
        nickname=nick,
    )
    raw = await tokens_crud.create_verification_token(db, user.id, "email_verify")
    link = verification_email_link(raw)
    send_email(user.email, "Verify your SYMBIO email", f"Confirm: {link}")
    await referrals_crud.attach_referral(db, user.id, payload.referral_code)
    await referrals_crud.get_or_create_referral_code(db, user.id, user.nickname)
    await add_audit(db, actor_user_id=user.id, action="user.register", entity_type="user", entity_id=str(user.id), meta={"email": user.email})
    await db.commit()
    return _issue_token(user)


@router.post("/login", response_model=TokenOut)
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await users_crud.get_by_email(db, payload.username)
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    await users_crud.touch_login(db, user)
    await add_audit(db, actor_user_id=user.id, action="user.login", entity_type="user", entity_id=str(user.id), meta={})
    await db.commit()
    return _issue_token(user)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return _user_out(user)


@router.get("/me/referral")
async def me_referral(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stats = await referrals_crud.get_referral_stats(db, user.id, user.nickname)
    from app.core.config import settings

    await db.commit()
    return {
        **stats,
        "referral_url": f"{settings.WEB_BASE_URL}/auth/register?ref={stats['code']}",
    }


@router.get("/me/identities")
async def me_identities(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = await tokens_crud.list_identities_for_user(db, user.id)
    providers = {r.provider: {"linked": True, "email": r.provider_email} for r in rows}
    from app.services import rewards as reward_cfg

    oauth = {p for p in providers if p in reward_cfg.SOCIAL_PROVIDERS}
    multiplier = reward_cfg.compute_trust_multiplier(user.email_verified, oauth)
    return {
        "providers": providers,
        "social_providers": sorted(oauth),
        "vote_multiplier": multiplier,
        "email_verified": user.email_verified,
    }


async def _steam_library_for_user(db: AsyncSession, user: User, *, force_refresh: bool = False) -> dict:
    identity = await tokens_crud.get_user_provider_identity(db, user.id, "steam")
    if not identity:
        return {
            "linked": False,
            "steam_id": None,
            "synced_at": None,
            "visibility": None,
            "game_count": 0,
            "matched_count": 0,
            "matched_slugs": [],
            "games": [],
            "symbio_games": [],
        }

    from app.db.crud.games import get_game_by_slug

    doc = await steam_library.build_library_payload(
        identity.provider_user_id,
        cached_meta=identity.meta,
        force_refresh=force_refresh,
        db=db,
    )
    meta_patch = doc.pop("_meta_patch", None)
    if meta_patch:
        await tokens_crud.merge_identity_meta(db, identity, meta_patch)

    symbio_games = []
    for slug in doc.get("matched_slugs") or []:
        game = await get_game_by_slug(db, slug)
        if game:
            symbio_games.append(
                {
                    "slug": game.slug,
                    "title": game.title,
                    "server_count": game.server_count,
                    "cover_url": game.cover_url,
                }
            )

    doc["linked"] = True
    doc["symbio_games"] = symbio_games
    return doc


@router.get("/me/steam/library")
async def me_steam_library(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    payload = await _steam_library_for_user(db, user, force_refresh=False)
    await db.commit()
    return payload


@router.get("/me/steam/recommendations")
async def me_steam_recommendations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=8, ge=1, le=20),
):
    identity = await tokens_crud.get_user_provider_identity(db, user.id, "steam")
    if not identity:
        return {"linked": False, "items": [], "matched_slugs": []}
    slugs = list(identity.meta.get("library_matched_slugs") or [])
    if not slugs:
        for g in identity.meta.get("owned_games") or []:
            if g.get("symbio_slug"):
                slugs.append(g["symbio_slug"])
        slugs = sorted(set(slugs))
    items = await steam_library.fetch_recommended_servers(db, slugs, limit=limit)
    return {"linked": True, "matched_slugs": slugs, "items": items}


@router.post("/me/steam/library/sync")
async def sync_steam_library(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    identity = await tokens_crud.get_user_provider_identity(db, user.id, "steam")
    if not identity:
        raise HTTPException(status_code=400, detail="Steam account not linked")
    payload = await _steam_library_for_user(db, user, force_refresh=True)
    await db.commit()
    return payload


@router.get("/me/wallet")
async def me_wallet(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.db.crud import billing as billing_crud

    balance = await billing_crud.get_wallet_balance(db, user.id)
    return {"balance_tokens": balance, "balance_credits": balance}


@router.patch("/me", response_model=UserOut)
async def update_me(body: ProfileUpdateIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await users_crud.update_user_profile(
        db, user, display_name=body.display_name, bio=body.bio, avatar_url=body.avatar_url, locale=body.locale
    )
    await db.commit()
    await db.refresh(user)
    return _user_out(user)


@router.post("/verify-email/request")
async def request_verify_email(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.email_verified:
        return {"status": "already_verified"}
    raw = await tokens_crud.create_verification_token(db, user.id, "email_verify")
    send_email(user.email, "Verify your SYMBIO email", f"Confirm: {verification_email_link(raw)}")
    await db.commit()
    return {"status": "sent"}


@router.post("/verify-email/confirm")
async def confirm_verify_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    row = await tokens_crud.consume_verification_token(db, token, "email_verify")
    if not row:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = await users_crud.get_by_id(db, row.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.email_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "verified"}


@router.get("/google/start")
async def google_start(
    link: bool = Query(default=False),
    user: User | None = Depends(get_current_user_optional),
):
    extra: dict = {}
    if link and user:
        extra["link_user_id"] = str(user.id)
    state = oauth_service.create_oauth_state("google", extra=extra or None)
    return {"url": oauth_service.google_auth_url(state), "state": state}


@router.get("/google/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    dev: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    state_data: dict | None = None
    if dev != "1":
        state_data = oauth_service.pop_oauth_state(state or "")
        if not state_data or state_data.get("provider") != "google":
            raise HTTPException(status_code=400, detail="Invalid OAuth state")
    if dev == "1" or not code:
        profile = {
            "provider_user_id": f"dev-google-{state or 'x'}",
            "email": f"google_dev_{state or 'x'}@symbio.dev",
            "name": "Google Dev",
        }
    else:
        profile = await oauth_service.exchange_google_code(code)
    link_user_id = (state_data or {}).get("link_user_id")
    return await _oauth_login(db, "google", profile, link_user_id=link_user_id)


@router.get("/steam/start")
async def steam_start(
    link: bool = Query(default=False),
    user: User | None = Depends(get_current_user_optional),
):
    extra: dict = {}
    if link and user:
        extra["link_user_id"] = str(user.id)
    state = oauth_service.create_oauth_state("steam", extra=extra or None)
    return {"url": oauth_service.steam_auth_url(state), "state": state}


@router.get("/steam/callback")
async def steam_callback(
    request: Request,
    state: str | None = None,
    dev: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    state_data: dict | None = None
    if dev != "1":
        state_data = oauth_service.pop_oauth_state(state or "")
        if not state_data or state_data.get("provider") != "steam":
            raise HTTPException(status_code=400, detail="Invalid OAuth state")

    if dev == "1":
        steam_id = f"dev-steam-{state or 'x'}"
        profile = {"provider_user_id": steam_id, "email": None, "name": f"Steam {steam_id}", "meta": {}}
    else:
        params = dict(request.query_params)
        if not await oauth_service.verify_steam_openid(params):
            raise HTTPException(status_code=400, detail="Steam OpenID verification failed")
        claimed = params.get("openid.claimed_id")
        if not claimed:
            raise HTTPException(status_code=400, detail="Missing Steam identity")
        steam_id = oauth_service.parse_steam_id_from_claimed(claimed)
        steam_profile = await oauth_service.fetch_steam_profile(steam_id)
        profile = {
            "provider_user_id": steam_id,
            "email": None,
            "name": steam_profile.get("personaname") or f"Steam {steam_id}",
            "meta": {
                "avatar_url": steam_profile.get("avatarfull"),
                "profileurl": steam_profile.get("profileurl"),
            },
        }

    link_user_id = (state_data or {}).get("link_user_id")
    return await _oauth_login(db, "steam", profile, link_user_id=link_user_id)


async def _oauth_login(db: AsyncSession, provider: str, profile: dict, link_user_id: str | None = None):
    meta = profile.get("meta") or {}

    if link_user_id:
        user = await users_crud.get_by_id(db, UUID(link_user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        existing = await tokens_crud.get_identity(db, provider, profile["provider_user_id"])
        if existing and existing.user_id != user.id:
            raise HTTPException(status_code=409, detail="Account already linked to another user")
        if not existing:
            await tokens_crud.link_identity(
                db,
                user.id,
                provider,
                profile["provider_user_id"],
                profile.get("email"),
                meta,
            )
        elif existing.user_id == user.id and meta:
            await tokens_crud.merge_identity_meta(db, existing, meta)
        if profile.get("name") and not user.display_name:
            user.display_name = profile["name"]
        if provider == "steam":
            await _sync_steam_library_on_login(db, user)
        await users_crud.touch_login(db, user)
        await db.commit()
        token = create_access_token(subject=user.email, roles=user.roles or ["user"])
        from app.core.config import settings

        return RedirectResponse(f"{settings.WEB_BASE_URL}/auth/oauth-callback?token={token}")

    identity = await tokens_crud.get_identity(db, provider, profile["provider_user_id"])
    if identity:
        user = await users_crud.get_by_id(db, identity.user_id)
    else:
        email = profile.get("email") or f"{provider}_{profile['provider_user_id']}@symbio.oauth"
        user = await users_crud.get_by_email(db, email)
        if not user:
            user = await users_crud.create_user(
                db,
                email=email,
                hashed_password=None,
                roles=["user"],
                nickname=None,
                display_name=profile.get("name"),
                email_verified=bool(profile.get("email")),
            )
        await tokens_crud.link_identity(
            db, user.id, provider, profile["provider_user_id"], profile.get("email"), meta or profile
        )
    if not user or not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    if provider == "steam":
        if meta:
            steam_identity = await tokens_crud.get_user_provider_identity(db, user.id, "steam")
            if steam_identity:
                await tokens_crud.merge_identity_meta(db, steam_identity, meta)
        await _sync_steam_library_on_login(db, user)
    await users_crud.touch_login(db, user)
    await db.commit()
    token = create_access_token(subject=user.email, roles=user.roles or ["user"])
    from app.core.config import settings

    return RedirectResponse(f"{settings.WEB_BASE_URL}/auth/oauth-callback?token={token}")


async def _sync_steam_library_on_login(db: AsyncSession, user: User) -> None:
    identity = await tokens_crud.get_user_provider_identity(db, user.id, "steam")
    if not identity:
        return
    try:
        doc = await steam_library.build_library_payload(
            identity.provider_user_id,
            cached_meta=identity.meta,
            force_refresh=True,
            db=db,
        )
        if doc.get("_meta_patch"):
            await tokens_crud.merge_identity_meta(db, identity, doc["_meta_patch"])
    except Exception:
        return
