import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.auth_identity import AuthIdentity, VerificationToken


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def create_verification_token(
    db: AsyncSession, user_id: UUID, purpose: str, hours: int = 24
) -> str:
    raw = secrets.token_urlsafe(32)
    row = VerificationToken(
        user_id=user_id,
        token_hash=_hash_token(raw),
        purpose=purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=hours),
    )
    db.add(row)
    await db.flush()
    return raw


async def consume_verification_token(db: AsyncSession, raw: str, purpose: str) -> VerificationToken | None:
    h = _hash_token(raw)
    row = (
        await db.execute(
            select(VerificationToken).where(
                VerificationToken.token_hash == h,
                VerificationToken.purpose == purpose,
                VerificationToken.consumed_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if not row or row.expires_at < datetime.now(timezone.utc):
        return None
    row.consumed_at = datetime.now(timezone.utc)
    return row


async def get_identity(db: AsyncSession, provider: str, provider_user_id: str) -> AuthIdentity | None:
    return (
        await db.execute(
            select(AuthIdentity).where(
                AuthIdentity.provider == provider,
                AuthIdentity.provider_user_id == provider_user_id,
            )
        )
    ).scalar_one_or_none()


async def list_identities_for_user(db: AsyncSession, user_id: UUID) -> list[AuthIdentity]:
    return (
        await db.execute(select(AuthIdentity).where(AuthIdentity.user_id == user_id))
    ).scalars().all()


async def get_user_provider_identity(
    db: AsyncSession, user_id: UUID, provider: str
) -> AuthIdentity | None:
    return (
        await db.execute(
            select(AuthIdentity).where(
                AuthIdentity.user_id == user_id,
                AuthIdentity.provider == provider,
            )
        )
    ).scalar_one_or_none()


async def merge_identity_meta(db: AsyncSession, identity: AuthIdentity, patch: dict) -> AuthIdentity:
    merged = {**(identity.meta or {}), **patch}
    identity.meta = merged
    await db.flush()
    return identity


async def link_identity(
    db: AsyncSession,
    user_id: UUID,
    provider: str,
    provider_user_id: str,
    provider_email: str | None = None,
    meta: dict | None = None,
) -> AuthIdentity:
    existing = await get_identity(db, provider, provider_user_id)
    if existing:
        return existing
    row = AuthIdentity(
        user_id=user_id,
        provider=provider,
        provider_user_id=provider_user_id,
        provider_email=provider_email,
        meta=meta or {},
    )
    db.add(row)
    await db.flush()
    return row
