from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.billing import Plan, Subscription, Wallet, WalletTransaction, Promotion, Invoice
from app.db.models.project import Project
from app.db.models.server import Server


PROMO_COSTS = {"featured": 50, "boost": 30, "pinned": 20}

NETWORK_PLAN_SLUGS = {"owner-growth", "owner-network"}
PROJECT_POOL_PLAN_SLUGS = {"owner-premium", *NETWORK_PLAN_SLUGS}
PROJECT_LIMITS = {"owner-starter": 1, "owner-premium": 3, "owner-growth": 10, "owner-network": None}
SERVER_LIMITS = {"owner-starter": 1, "owner-premium": 10, "owner-growth": 100, "owner-network": None}


async def list_plans(db: AsyncSession, audience: str | None = None) -> list[Plan]:
    stmt = select(Plan).where(Plan.is_active == True).order_by(Plan.sort_order)  # noqa: E712
    if audience:
        stmt = stmt.where(Plan.audience == audience)
    return (await db.execute(stmt)).scalars().all()


async def get_plan_by_slug(db: AsyncSession, slug: str) -> Plan | None:
    return (await db.execute(select(Plan).where(Plan.slug == slug))).scalar_one_or_none()


async def get_active_subscription_plan(db: AsyncSession, user_id: UUID) -> Plan | None:
    now = datetime.now(timezone.utc)
    row = (
        await db.execute(
            select(Subscription, Plan)
            .join(Plan, Plan.id == Subscription.plan_id)
            .where(
                Subscription.user_id == user_id,
                Subscription.status == "active",
                (Subscription.expires_at.is_(None) | (Subscription.expires_at > now)),
            )
            .order_by(Plan.price_monthly.desc(), Subscription.expires_at.desc().nullslast())
            .limit(1)
        )
    ).first()
    return row[1] if row else None


async def _owned_server(db: AsyncSession, user_id: UUID, server_id: UUID) -> Server | None:
    return (
        await db.execute(select(Server).where(Server.id == server_id, Server.owner_id == user_id))
    ).scalar_one_or_none()


async def _owned_project(db: AsyncSession, user_id: UUID, project_id: UUID) -> Project | None:
    return (
        await db.execute(select(Project).where(Project.id == project_id, Project.owner_id == user_id))
    ).scalar_one_or_none()


async def can_promote_target(db: AsyncSession, user_id: UUID, target_type: str, target_id: UUID) -> tuple[bool, str | None]:
    plan = await get_active_subscription_plan(db, user_id)
    plan_slug = plan.slug if plan else "owner-starter"

    if target_type == "server":
        server = await _owned_server(db, user_id, target_id)
        if not server:
            return False, "Server is not owned by user"
        if plan_slug in NETWORK_PLAN_SLUGS:
            return True, None
        if plan_slug in PROJECT_POOL_PLAN_SLUGS:
            if server.project_id:
                project = await _owned_project(db, user_id, server.project_id)
                return (project is not None), None if project else "Server project is not owned by user"
            return True, None
        return True, None

    if target_type == "project":
        project = await _owned_project(db, user_id, target_id)
        if not project:
            return False, "Project is not owned by user"
        if plan_slug in PROJECT_POOL_PLAN_SLUGS:
            return True, None
        return False, "Project-level token pool requires Owner Premium or higher"

    return False, "Unsupported promotion target"


async def can_create_project(db: AsyncSession, user_id: UUID) -> tuple[bool, str | None]:
    plan = await get_active_subscription_plan(db, user_id)
    limit = PROJECT_LIMITS.get(plan.slug if plan else "owner-starter", 1)
    if limit is None:
        return True, None
    count = (
        await db.execute(select(func.count(Project.id)).where(Project.owner_id == user_id))
    ).scalar_one()
    if count >= limit:
        return False, f"Project limit reached for current plan ({limit})"
    return True, None


async def can_create_server(db: AsyncSession, user_id: UUID, project_id: UUID | None = None) -> tuple[bool, str | None]:
    if project_id:
        project = await _owned_project(db, user_id, project_id)
        if not project:
            return False, "Project is not owned by user"

    plan = await get_active_subscription_plan(db, user_id)
    limit = SERVER_LIMITS.get(plan.slug if plan else "owner-starter", 1)
    if limit is None:
        return True, None
    count = (
        await db.execute(select(func.count(Server.id)).where(Server.owner_id == user_id))
    ).scalar_one()
    if count >= limit:
        return False, f"Server limit reached for current plan ({limit})"
    return True, None


async def get_or_create_wallet(db: AsyncSession, user_id: UUID) -> Wallet:
    wallet = (await db.execute(select(Wallet).where(Wallet.user_id == user_id))).scalar_one_or_none()
    if wallet:
        return wallet
    wallet = Wallet(user_id=user_id, balance_credits=0)
    db.add(wallet)
    await db.flush()
    return wallet


async def get_wallet_balance(db: AsyncSession, user_id: UUID) -> int:
    wallet = await get_or_create_wallet(db, user_id)
    return wallet.balance_credits


async def add_credits(
    db: AsyncSession,
    user_id: UUID,
    amount: int,
    tx_type: str,
    description: str | None = None,
    meta: dict | None = None,
) -> Wallet:
    wallet = await get_or_create_wallet(db, user_id)
    wallet.balance_credits += amount
    wallet.updated_at = datetime.now(timezone.utc)
    db.add(
        WalletTransaction(
            wallet_id=wallet.id,
            amount=amount,
            tx_type=tx_type,
            description=description,
            meta=meta or {},
        )
    )
    return wallet


async def spend_credits(
    db: AsyncSession,
    user_id: UUID,
    amount: int,
    tx_type: str,
    description: str | None = None,
    meta: dict | None = None,
) -> Wallet | None:
    wallet = await get_or_create_wallet(db, user_id)
    if wallet.balance_credits < amount:
        return None
    wallet.balance_credits -= amount
    wallet.updated_at = datetime.now(timezone.utc)
    db.add(
        WalletTransaction(
            wallet_id=wallet.id,
            amount=-amount,
            tx_type=tx_type,
            description=description,
            meta=meta or {},
        )
    )
    return wallet


async def checkout_plan(db: AsyncSession, user_id: UUID, plan_slug: str, provider: str = "mock") -> dict:
    plan = await get_plan_by_slug(db, plan_slug)
    if not plan:
        raise ValueError("Plan not found")
    invoice = Invoice(
        user_id=user_id,
        amount=plan.price_monthly,
        provider=provider,
        status="paid" if provider == "mock" else "pending",
        provider_ref=f"mock-{user_id}-{plan.slug}",
        meta={"plan_slug": plan.slug},
    )
    db.add(invoice)
    await db.flush()
    if provider == "mock":
        sub = Subscription(
            user_id=user_id,
            plan_id=plan.id,
            status="active",
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db.add(sub)
    if provider == "mock" and plan.credits_monthly:
        await add_credits(db, user_id, plan.credits_monthly, "subscription", f"Credits from {plan.name}")
    return {"invoice_id": str(invoice.id), "status": invoice.status, "plan": plan.slug}


async def create_promotion(
    db: AsyncSession,
    user_id: UUID,
    target_type: str,
    target_id: UUID,
    promo_type: str,
    days: int,
) -> Promotion | None:
    allowed, _reason = await can_promote_target(db, user_id, target_type, target_id)
    if not allowed:
        return None
    cost = PROMO_COSTS.get(promo_type, 30) * days
    wallet = await spend_credits(
        db,
        user_id,
        cost,
        "promotion",
        f"{promo_type} for {days}d",
        meta={"target_type": target_type, "target_id": str(target_id), "promo_type": promo_type, "days": days},
    )
    if not wallet:
        return None
    promo = Promotion(
        user_id=user_id,
        target_type=target_type,
        target_id=target_id,
        promo_type=promo_type,
        credits_spent=cost,
        ends_at=datetime.now(timezone.utc) + timedelta(days=days),
    )
    db.add(promo)
    await db.flush()
    return promo


async def grant_plan_subscription(
    db: AsyncSession,
    user_id: UUID,
    plan_slug: str,
    days: int = 30,
    source: str = "referral_milestone",
) -> Subscription | None:
    plan = await get_plan_by_slug(db, plan_slug)
    if not plan:
        return None
    now = datetime.now(timezone.utc)
    existing = (
        await db.execute(
            select(Subscription)
            .where(Subscription.user_id == user_id, Subscription.status == "active")
            .order_by(Subscription.expires_at.desc())
        )
    ).scalar_one_or_none()
    base = existing.expires_at if existing and existing.expires_at and existing.expires_at > now else now
    expires = base + timedelta(days=days)
    if existing and existing.plan_id == plan.id:
        existing.expires_at = expires
        sub = existing
    else:
        sub = Subscription(
            user_id=user_id,
            plan_id=plan.id,
            status="active",
            expires_at=expires,
        )
        db.add(sub)
    await db.flush()
    return sub


async def list_wallet_transactions(db: AsyncSession, user_id: UUID, limit: int = 50):
    wallet = await get_or_create_wallet(db, user_id)
    from app.db.models.billing import WalletTransaction

    rows = (
        await db.execute(
            select(WalletTransaction)
            .where(WalletTransaction.wallet_id == wallet.id)
            .order_by(WalletTransaction.created_at.desc())
            .limit(limit)
        )
    ).scalars().all()
    return [
        {
            "id": str(t.id),
            "amount": t.amount,
            "tx_type": t.tx_type,
            "description": t.description,
            "created_at": t.created_at.isoformat(),
        }
        for t in rows
    ]
