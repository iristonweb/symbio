from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.article import Article


async def list_articles(
    db: AsyncSession,
    article_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    stmt = select(Article).where(Article.moderation_status == "approved")
    if article_type:
        stmt = stmt.where(Article.article_type == article_type)
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = stmt.order_by(Article.published_at.desc().nullslast()).offset(offset).limit(limit)
    items = (await db.execute(stmt)).scalars().all()
    return items, int(total)


async def get_article_by_slug(db: AsyncSession, slug: str) -> Article | None:
    return (
        await db.execute(
            select(Article).where(Article.slug == slug, Article.moderation_status == "approved")
        )
    ).scalar_one_or_none()
