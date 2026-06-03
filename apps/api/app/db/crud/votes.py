from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.crud import billing as billing_crud
from app.db.crud import auth_tokens as tokens_crud
from app.db.models.server import Server
from app.db.models.vote import ServerVote
from app.db.models.billing import WalletTransaction, Wallet
from app.services import rewards as reward_cfg
from app.services.steam_library import user_owns_symbio_game


class VoteError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


async def _oauth_providers(db: AsyncSession, user_id: UUID) -> set[str]:
    rows = await tokens_crud.list_identities_for_user(db, user_id)
    return {r.provider for r in rows}


async def _rewarded_votes_count(
    db: AsyncSession, user_id: UUID, since: datetime
) -> int:
    return (
        await db.execute(
            select(func.count())
            .select_from(ServerVote)
            .where(
                ServerVote.user_id == user_id,
                ServerVote.rewarded == True,  # noqa: E712
                ServerVote.created_at >= since,
            )
        )
    ).scalar() or 0


async def _vote_tokens_this_month(db: AsyncSession, user_id: UUID) -> int:
    wallet = await billing_crud.get_or_create_wallet(db, user_id)
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    total = (
        await db.execute(
            select(func.coalesce(func.sum(WalletTransaction.amount), 0))
            .where(
                WalletTransaction.wallet_id == wallet.id,
                WalletTransaction.tx_type == "vote_reward",
                WalletTransaction.created_at >= month_start,
                WalletTransaction.amount > 0,
            )
        )
    ).scalar()
    return int(total or 0)


async def _last_vote_for_server(
    db: AsyncSession, user_id: UUID, server_id: UUID
) -> ServerVote | None:
    return (
        await db.execute(
            select(ServerVote)
            .where(ServerVote.user_id == user_id, ServerVote.server_id == server_id)
            .order_by(ServerVote.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()


async def _first_rewarded_vote_today(db: AsyncSession, user_id: UUID) -> bool:
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count = await _rewarded_votes_count(db, user_id, today)
    return count == 0


async def cast_server_vote(
    db: AsyncSession,
    user_id: UUID,
    server_id: UUID,
    *,
    email_verified: bool,
    user_created_at: datetime,
    server_owner_id: UUID | None,
) -> dict:
    server = (await db.execute(select(Server).where(Server.id == server_id))).scalar_one_or_none()
    if not server:
        raise VoteError("not_found", "Server not found")
    if server.moderation_status != "approved":
        raise VoteError("not_approved", "Server is not available for voting")

    now = datetime.now(timezone.utc)
    last = await _last_vote_for_server(db, user_id, server_id)
    if last:
        cooldown_end = last.created_at + timedelta(days=reward_cfg.VOTE_COOLDOWN_DAYS)
        if now < cooldown_end:
            raise VoteError(
                "cooldown",
                f"You can vote again after {cooldown_end.isoformat()}",
            )

    providers = await _oauth_providers(db, user_id)
    multiplier = reward_cfg.compute_trust_multiplier(email_verified, providers)
    steam_identity = await tokens_crud.get_user_provider_identity(db, user_id, "steam")
    owns_game = await user_owns_symbio_game(steam_identity.meta if steam_identity else None, server.game)
    multiplier = reward_cfg.apply_owns_game_bonus(multiplier, owns_game)

    can_reward = email_verified and reward_cfg.account_age_ok(user_created_at)
    if server_owner_id and server_owner_id == user_id:
        can_reward = False

    reward_amount = 0
    rewarded = False
    if can_reward:
        day_ago = now - timedelta(days=1)
        week_ago = now - timedelta(days=7)
        daily = await _rewarded_votes_count(db, user_id, day_ago)
        weekly = await _rewarded_votes_count(db, user_id, week_ago)
        monthly_tokens = await _vote_tokens_this_month(db, user_id)

        if daily < reward_cfg.MAX_REWARDED_VOTES_PER_DAY and weekly < reward_cfg.MAX_REWARDED_VOTES_PER_WEEK:
            first_today = await _first_rewarded_vote_today(db, user_id)
            candidate = reward_cfg.compute_vote_reward_amount(
                reward_cfg.VOTE_BASE_TOKENS, multiplier, first_today
            )
            if monthly_tokens + candidate <= reward_cfg.MAX_VOTE_TOKENS_PER_MONTH:
                reward_amount = candidate
                rewarded = True

    vote = ServerVote(
        user_id=user_id,
        server_id=server_id,
        rewarded=rewarded,
        reward_amount=reward_amount,
        multiplier=multiplier,
    )
    db.add(vote)
    server.votes += 1
    await db.flush()

    if rewarded and reward_amount > 0:
        await billing_crud.add_credits(
            db,
            user_id,
            reward_amount,
            "vote_reward",
            f"Vote for {server.name}",
            meta={
                "server_id": str(server_id),
                "vote_id": str(vote.id),
                "multiplier": multiplier,
                "providers": sorted(providers & reward_cfg.SOCIAL_PROVIDERS),
            },
        )

    balance = await billing_crud.get_wallet_balance(db, user_id)
    next_vote_at = (vote.created_at + timedelta(days=reward_cfg.VOTE_COOLDOWN_DAYS)).isoformat()

    return {
        "vote_id": str(vote.id),
        "server_id": str(server_id),
        "votes": server.votes,
        "rewarded": rewarded,
        "earned_tokens": reward_amount,
        "multiplier": multiplier,
        "wallet_balance": balance,
        "next_vote_at": next_vote_at,
        "social_providers": sorted(providers & reward_cfg.SOCIAL_PROVIDERS),
        "email_verified": email_verified,
        "owns_game_bonus": owns_game,
    }
