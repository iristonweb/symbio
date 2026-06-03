from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.contest import Contest, ContestEntry


async def list_contests(db: AsyncSession, status: str | None = None, limit: int = 50):
    stmt = select(Contest)
    if status:
        stmt = stmt.where(Contest.status == status)
    stmt = stmt.order_by(Contest.ends_at.desc().nullslast()).limit(limit)
    return (await db.execute(stmt)).scalars().all()


async def get_contest_by_slug(db: AsyncSession, slug: str) -> Contest | None:
    return (await db.execute(select(Contest).where(Contest.slug == slug))).scalar_one_or_none()


async def join_contest(db: AsyncSession, contest_id: UUID, user_id: UUID) -> ContestEntry:
    existing = (
        await db.execute(
            select(ContestEntry).where(
                ContestEntry.contest_id == contest_id, ContestEntry.user_id == user_id
            )
        )
    ).scalar_one_or_none()
    if existing:
        return existing
    entry = ContestEntry(contest_id=contest_id, user_id=user_id)
    db.add(entry)
    await db.flush()
    return entry
