import re
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.marketplace import (
    MarketplaceProduct,
    ProductVersion,
    Cart,
    CartItem,
    Order,
    OrderItem,
    License,
    Review,
    WishlistItem,
)
from app.db.models.billing import Promotion
from app.core.config import settings


def slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:80] or "product"


async def list_products(
    db: AsyncSession,
    *,
    q: str | None = None,
    game_slug: str | None = None,
    product_type: str | None = None,
    only_approved: bool = True,
    creator_id: UUID | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[MarketplaceProduct], int]:
    stmt = select(MarketplaceProduct).where(MarketplaceProduct.is_active == True)  # noqa: E712
    if only_approved:
        stmt = stmt.where(MarketplaceProduct.moderation_status == "approved")
    if game_slug:
        stmt = stmt.where(MarketplaceProduct.game_slug == game_slug)
    if product_type:
        stmt = stmt.where(MarketplaceProduct.product_type == product_type)
    if creator_id:
        stmt = stmt.where(MarketplaceProduct.creator_id == creator_id)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(MarketplaceProduct.title).like(like),
                func.lower(MarketplaceProduct.short_description).like(like),
            )
        )
    count_stmt = select(func.count(MarketplaceProduct.id))
    if only_approved:
        count_stmt = count_stmt.where(MarketplaceProduct.moderation_status == "approved", MarketplaceProduct.is_active == True)  # noqa: E712
    if game_slug:
        count_stmt = count_stmt.where(MarketplaceProduct.game_slug == game_slug)
    if product_type:
        count_stmt = count_stmt.where(MarketplaceProduct.product_type == product_type)
    if creator_id:
        count_stmt = count_stmt.where(MarketplaceProduct.creator_id == creator_id)
    if q:
        like = f"%{q.lower()}%"
        count_stmt = count_stmt.where(
            or_(
                func.lower(MarketplaceProduct.title).like(like),
                func.lower(MarketplaceProduct.short_description).like(like),
            )
        )
    total = (await db.execute(count_stmt)).scalar_one()
    promoted = (
        select(Promotion.target_id)
        .where(Promotion.target_type.in_(["product", "marketplace_product"]), Promotion.status == "active")
        .subquery()
    )
    rows = (
        await db.execute(
            stmt.order_by(
                MarketplaceProduct.id.in_(select(promoted.c.target_id)).desc(),
                MarketplaceProduct.sales_count.desc(),
                MarketplaceProduct.rating_avg.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
    ).scalars().all()
    return list(rows), int(total or 0)


async def get_product_by_slug(db: AsyncSession, slug: str) -> MarketplaceProduct | None:
    return (await db.execute(select(MarketplaceProduct).where(MarketplaceProduct.slug == slug))).scalar_one_or_none()


async def get_product(db: AsyncSession, product_id: UUID) -> MarketplaceProduct | None:
    return (await db.execute(select(MarketplaceProduct).where(MarketplaceProduct.id == product_id))).scalar_one_or_none()


async def create_product(
    db: AsyncSession,
    creator_id: UUID,
    data: dict,
) -> MarketplaceProduct:
    base_slug = slugify(data["title"])
    slug = base_slug
    for i in range(10):
        exists = await get_product_by_slug(db, slug)
        if not exists:
            break
        slug = f"{base_slug}-{i + 1}"
    product = MarketplaceProduct(
        creator_id=creator_id,
        slug=slug,
        title=data["title"],
        short_description=data.get("short_description"),
        description=data.get("description"),
        product_type=data.get("product_type", "mod"),
        game_slug=data.get("game_slug"),
        price_rub=float(data.get("price_rub", 0)),
        is_free=bool(data.get("is_free", False)),
        cover_url=data.get("cover_url"),
        tags=data.get("tags", []),
        moderation_status="pending",
    )
    if product.is_free:
        product.price_rub = 0
    db.add(product)
    await db.flush()
    version = ProductVersion(product_id=product.id, version=data.get("version", "1.0.0"), is_latest=True)
    db.add(version)
    await db.flush()
    return product


async def get_or_create_cart(db: AsyncSession, user_id: UUID) -> Cart:
    cart = (await db.execute(select(Cart).where(Cart.user_id == user_id))).scalar_one_or_none()
    if cart:
        return cart
    cart = Cart(user_id=user_id)
    db.add(cart)
    await db.flush()
    return cart


async def get_cart_items(db: AsyncSession, cart_id: UUID) -> list[tuple[CartItem, MarketplaceProduct]]:
    rows = (
        await db.execute(
            select(CartItem, MarketplaceProduct)
            .join(MarketplaceProduct, MarketplaceProduct.id == CartItem.product_id)
            .where(CartItem.cart_id == cart_id)
        )
    ).all()
    return [(r[0], r[1]) for r in rows]


async def add_to_cart(db: AsyncSession, user_id: UUID, product_id: UUID) -> Cart:
    cart = await get_or_create_cart(db, user_id)
    existing = (
        await db.execute(
            select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
        )
    ).scalar_one_or_none()
    if not existing:
        db.add(CartItem(cart_id=cart.id, product_id=product_id))
        cart.updated_at = datetime.now(timezone.utc)
    return cart


async def remove_from_cart(db: AsyncSession, user_id: UUID, product_id: UUID) -> None:
    cart = await get_or_create_cart(db, user_id)
    item = (
        await db.execute(
            select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
        )
    ).scalar_one_or_none()
    if item:
        await db.delete(item)


async def commission_for_creator(db: AsyncSession, creator_id: UUID) -> float:
    from app.db.models.billing import Subscription, Plan
    from app.db.models.user import User

    user = await db.get(User, creator_id)
    if not user:
        return settings.DEFAULT_COMMISSION_PERCENT
    sub = (
        await db.execute(
            select(Plan)
            .join(Subscription, Subscription.plan_id == Plan.id)
            .where(Subscription.user_id == creator_id, Subscription.status == "active")
            .order_by(Subscription.started_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if sub and sub.commission_percent is not None:
        return float(sub.commission_percent)
    return settings.DEFAULT_COMMISSION_PERCENT


async def fulfill_paid_order(db: AsyncSession, order: Order) -> Order:
    items = (
        await db.execute(
            select(OrderItem, MarketplaceProduct)
            .join(MarketplaceProduct, MarketplaceProduct.id == OrderItem.product_id)
            .where(OrderItem.order_id == order.id)
        )
    ).all()
    order.status = "paid"
    order.paid_at = datetime.now(timezone.utc)
    for _, product in items:
        existing = (
            await db.execute(
                select(License).where(License.user_id == order.user_id, License.product_id == product.id)
            )
        ).scalar_one_or_none()
        if not existing:
            db.add(License(user_id=order.user_id, product_id=product.id, order_id=order.id))
        product.sales_count += 1
    cart = await get_or_create_cart(db, order.user_id)
    cart_items = await get_cart_items(db, cart.id)
    for item, _ in cart_items:
        await db.delete(item)
    return order


async def checkout_cart(db: AsyncSession, user_id: UUID, provider: str = "mock") -> Order | None:
    cart = await get_or_create_cart(db, user_id)
    items = await get_cart_items(db, cart.id)
    if not items:
        return None

    total = sum(0.0 if p.is_free else p.price_rub for _, p in items)
    order = Order(user_id=user_id, total_rub=total, provider=provider, status="pending")
    db.add(order)
    await db.flush()

    for _, product in items:
        commission = await commission_for_creator(db, product.creator_id)
        payout = product.price_rub * (1 - commission / 100) if not product.is_free else 0
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                price_rub=0 if product.is_free else product.price_rub,
                creator_id=product.creator_id,
                commission_percent=commission,
                creator_payout_rub=payout,
            )
        )

    if provider == "mock":
        order.provider_ref = f"mock-order-{order.id}"
        await fulfill_paid_order(db, order)

    return order


async def user_library(db: AsyncSession, user_id: UUID) -> list[tuple[License, MarketplaceProduct]]:
    rows = (
        await db.execute(
            select(License, MarketplaceProduct)
            .join(MarketplaceProduct, MarketplaceProduct.id == License.product_id)
            .where(License.user_id == user_id)
            .order_by(License.granted_at.desc())
        )
    ).all()
    return [(r[0], r[1]) for r in rows]


async def add_review(db: AsyncSession, user_id: UUID, product_id: UUID, rating: int, body: str | None) -> Review:
    review = Review(product_id=product_id, user_id=user_id, rating=rating, body=body)
    db.add(review)
    await db.flush()
    product = await get_product(db, product_id)
    if product:
        avg_row = await db.execute(
            select(func.avg(Review.rating), func.count(Review.id)).where(Review.product_id == product_id)
        )
        avg, cnt = avg_row.one()
        product.rating_avg = float(avg or 0)
        product.rating_count = int(cnt or 0)
    return review


async def toggle_wishlist(db: AsyncSession, user_id: UUID, product_id: UUID) -> bool:
    row = (
        await db.execute(
            select(WishlistItem).where(WishlistItem.user_id == user_id, WishlistItem.product_id == product_id)
        )
    ).scalar_one_or_none()
    if row:
        await db.delete(row)
        return False
    db.add(WishlistItem(user_id=user_id, product_id=product_id))
    return True
