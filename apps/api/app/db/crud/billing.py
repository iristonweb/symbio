from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.billing import Plan, Subscription, Wallet, WalletTransaction, Promotion, Invoice


PROMO_COSTS = {"featured": 50, "boost": 30, "pinned": 20}


async def list_plans(db: AsyncSession, audience: str | None = None) -> list[Plan]:
    stmt = select(Plan).where(Plan.is_active == True).order_by(Plan.sort_order)  # noqa: E712
    if audience:
        stmt = stmt.where(Plan.audience == audience)
    return (await db.execute(stmt)).scalars().all()


async def get_plan_by_slug(db: AsyncSession, slug: str) -> Plan | None:
    return (await db.execute(select(Plan).where(Plan.slug == slug))).scalar_one_or_none()


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


async def add_credits(db: AsyncSession, user_id: UUID, amount: int, tx_type: str, description: str | None = None) -> Wallet:
    wallet = await get_or_create_wallet(db, user_id)
    wallet.balance_credits += amount
    wallet.updated_at = datetime.now(timezone.utc)
    db.add(
        WalletTransaction(
            wallet_id=wallet.id,
            amount=amount,
            tx_type=tx_type,
            description=description,
        )
    )
    return wallet


async def spend_credits(db: AsyncSession, user_id: UUID, amount: int, tx_type: str, description: str | None = None) -> Wallet | None:
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
    cost = PROMO_COSTS.get(promo_type, 30) * days
    wallet = await spend_credits(db, user_id, cost, "promotion", f"{promo_type} for {days}d")
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
