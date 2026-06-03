from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.game import Game, Genre


async def list_games(
    db: AsyncSession,
    category: str | None = None,
    genre: str | None = None,
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    stmt = select(Game).options(selectinload(Game.genres))
    if category:
        stmt = stmt.where(Game.category == category)
    if genre:
        stmt = stmt.join(Game.genres).where(Genre.slug == genre)
    if q:
        stmt = stmt.where(Game.title.ilike(f"%{q}%"))
    count_stmt = select(func.count(Game.id))
    if category:
        count_stmt = count_stmt.where(Game.category == category)
    if q:
        count_stmt = count_stmt.where(Game.title.ilike(f"%{q}%"))
    total = (await db.execute(count_stmt)).scalar_one()
    stmt = stmt.order_by(Game.rating.desc(), Game.title).offset(offset).limit(limit)
    items = (await db.execute(stmt)).scalars().unique().all()
    return items, int(total)


async def get_game_by_slug(db: AsyncSession, slug: str) -> Game | None:
    stmt = select(Game).options(selectinload(Game.genres)).where(Game.slug == slug)
    return (await db.execute(stmt)).scalar_one_or_none()
