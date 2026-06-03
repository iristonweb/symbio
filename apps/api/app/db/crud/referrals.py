import re
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.crud import billing as billing_crud
from app.db.crud import users as users_crud
from app.db.models.referral import Referral, ReferralCode, ReferralMilestoneGrant
from app.services import rewards as reward_cfg


def _normalize_code(code: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "", code.strip())[:32].lower()


async def get_or_create_referral_code(db: AsyncSession, user_id: UUID, nickname: str) -> ReferralCode:
    existing = (
        await db.execute(select(ReferralCode).where(ReferralCode.user_id == user_id))
    ).scalar_one_or_none()
    if existing:
        return existing
    base = _normalize_code(nickname) or str(user_id)[:8]
    code = base
    n = 0
    while (
        await db.execute(select(ReferralCode).where(ReferralCode.code == code))
    ).scalar_one_or_none():
        n += 1
        code = f"{base}{n}"
    row = ReferralCode(user_id=user_id, code=code)
    db.add(row)
    await db.flush()
    return row


async def attach_referral(db: AsyncSession, referee_id: UUID, referral_code: str | None) -> Referral | None:
    if not referral_code:
        return None
    code = _normalize_code(referral_code)
    if not code:
        return None
    ref_code = (
        await db.execute(select(ReferralCode).where(ReferralCode.code == code))
    ).scalar_one_or_none()
    if not ref_code or ref_code.user_id == referee_id:
        return None
    existing = (
        await db.execute(select(Referral).where(Referral.referee_id == referee_id))
    ).scalar_one_or_none()
    if existing:
        return existing
    row = Referral(referrer_id=ref_code.user_id, referee_id=referee_id, status="pending")
    db.add(row)
    await db.flush()
    return row


async def count_qualified_referrals(db: AsyncSession, referrer_id: UUID) -> int:
    return (
        await db.execute(
            select(func.count())
            .select_from(Referral)
            .where(Referral.referrer_id == referrer_id, Referral.status == "qualified")
        )
    ).scalar() or 0


async def count_qualified_this_month(db: AsyncSession, referrer_id: UUID) -> int:
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return (
        await db.execute(
            select(func.count())
            .select_from(Referral)
            .where(
                Referral.referrer_id == referrer_id,
                Referral.status == "qualified",
                Referral.qualified_at >= month_start,
            )
        )
    ).scalar() or 0


async def _grant_milestone_if_needed(db: AsyncSession, referrer_id: UUID, qualified_total: int) -> list[int]:
    granted: list[int] = []
    for milestone, tokens in sorted(reward_cfg.REFERRAL_MILESTONES.items()):
        if qualified_total < milestone:
            continue
        already = (
            await db.execute(
                select(ReferralMilestoneGrant).where(
                    ReferralMilestoneGrant.user_id == referrer_id,
                    ReferralMilestoneGrant.milestone == milestone,
                )
            )
        ).scalar_one_or_none()
        if already:
            continue
        db.add(ReferralMilestoneGrant(user_id=referrer_id, milestone=milestone))
        await billing_crud.add_credits(
            db,
            referrer_id,
            tokens,
            "referral_milestone",
            f"Referral milestone {milestone}",
            meta={"milestone": milestone, "qualified_total": qualified_total},
        )
        granted.append(milestone)

    if qualified_total >= reward_cfg.REFERRAL_MILESTONE_100:
        top_grant = (
            await db.execute(
                select(ReferralMilestoneGrant).where(
                    ReferralMilestoneGrant.user_id == referrer_id,
                    ReferralMilestoneGrant.milestone == reward_cfg.REFERRAL_MILESTONE_100,
                )
            )
        ).scalar_one_or_none()
        if not top_grant:
            sub = await billing_crud.grant_plan_subscription(
                db,
                referrer_id,
                reward_cfg.REFERRAL_TOP_PLAN_SLUG,
                reward_cfg.REFERRAL_TOP_PLAN_DAYS,
            )
            if sub:
                db.add(
                    ReferralMilestoneGrant(
                        user_id=referrer_id, milestone=reward_cfg.REFERRAL_MILESTONE_100
                    )
                )
                granted.append(reward_cfg.REFERRAL_MILESTONE_100)
    return granted


async def qualify_referral_on_action(db: AsyncSession, referee_id: UUID) -> dict | None:
    ref = (
        await db.execute(
            select(Referral).where(Referral.referee_id == referee_id, Referral.status == "pending")
        )
    ).scalar_one_or_none()
    if not ref:
        return None
    referee = await users_crud.get_by_id(db, referee_id)
    if not referee or not referee.email_verified:
        return None

    monthly = await count_qualified_this_month(db, ref.referrer_id)
    ref.status = "qualified"
    ref.qualified_at = datetime.now(timezone.utc)

    if monthly < reward_cfg.REFERRAL_MAX_QUALIFIED_PER_MONTH and not ref.referrer_rewarded:
        await billing_crud.add_credits(
            db,
            ref.referrer_id,
            reward_cfg.REFERRAL_REFERRER_TOKENS,
            "referral_reward",
            "Qualified referral bonus",
            meta={"referee_id": str(referee_id)},
        )
        ref.referrer_rewarded = True
    if not ref.referee_rewarded:
        await billing_crud.add_credits(
            db,
            referee_id,
            reward_cfg.REFERRAL_REFEREE_TOKENS,
            "referral_welcome",
            "Welcome referral bonus",
            meta={"referrer_id": str(ref.referrer_id)},
        )
        ref.referee_rewarded = True

    total = await count_qualified_referrals(db, ref.referrer_id)
    milestones = await _grant_milestone_if_needed(db, ref.referrer_id, total)
    return {
        "referrer_id": str(ref.referrer_id),
        "qualified_total": total,
        "milestones_granted": milestones,
    }


async def get_referral_stats(db: AsyncSession, user_id: UUID, nickname: str) -> dict:
    code_row = await get_or_create_referral_code(db, user_id, nickname)
    pending = (
        await db.execute(
            select(func.count())
            .select_from(Referral)
            .where(Referral.referrer_id == user_id, Referral.status == "pending")
        )
    ).scalar() or 0
    qualified = await count_qualified_referrals(db, user_id)
    milestones_granted = (
        await db.execute(
            select(ReferralMilestoneGrant.milestone).where(ReferralMilestoneGrant.user_id == user_id)
        )
    ).scalars().all()
    return {
        "code": code_row.code,
        "pending_count": pending,
        "qualified_count": qualified,
        "target_qualified": reward_cfg.REFERRAL_MILESTONE_100,
        "top_plan_slug": reward_cfg.REFERRAL_TOP_PLAN_SLUG,
        "top_plan_days": reward_cfg.REFERRAL_TOP_PLAN_DAYS,
        "milestones_granted": list(milestones_granted),
        "milestones": reward_cfg.REFERRAL_MILESTONES,
    }
