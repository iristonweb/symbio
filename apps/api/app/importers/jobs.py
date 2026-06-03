"""Background reindex job for search."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.game import Game
from app.db.models.project import Project
from app.db.models.server import Server
from app.db.models.snapshot import ServerSnapshot
from app.db.models.article import Article
from app.db.models.marketplace import MarketplaceProduct
from app.services.search import ensure_indexes, index_documents


async def reindex_all(db: AsyncSession) -> dict:
    await ensure_indexes()
    counts = {}

    games = (await db.execute(select(Game).options(selectinload(Game.genres)))).scalars().all()
    docs = [
        {
            "id": str(g.id),
            "slug": g.slug,
            "title": g.title,
            "category": g.category,
            "genres": [x.slug for x in g.genres],
        }
        for g in games
    ]
    await index_documents("games", docs)
    counts["games"] = len(docs)

    projects = (await db.execute(select(Project))).scalars().all()
    docs = [{"id": str(p.id), "slug": p.slug, "name": p.name, "game_slugs": p.game_slugs} for p in projects]
    await index_documents("projects", docs)
    counts["projects"] = len(docs)

    servers = (await db.execute(select(Server))).scalars().all()
    docs = [{"id": str(s.id), "name": s.name, "game": s.game, "region": s.region} for s in servers]
    await index_documents("servers", docs)
    counts["servers"] = len(docs)

    articles = (await db.execute(select(Article))).scalars().all()
    docs = [{"id": str(a.id), "slug": a.slug, "title": a.title, "article_type": a.article_type} for a in articles]
    await index_documents("articles", docs)
    counts["articles"] = len(docs)

    products = (
        await db.execute(select(MarketplaceProduct).where(MarketplaceProduct.moderation_status == "approved"))
    ).scalars().all()
    docs = [
        {
            "id": str(p.id),
            "slug": p.slug,
            "title": p.title,
            "description": p.short_description,
            "product_type": p.product_type,
            "game_slug": p.game_slug,
            "tags": p.tags,
            "price_rub": p.price_rub,
            "sales_count": p.sales_count,
            "rating_avg": p.rating_avg,
        }
        for p in products
    ]
    await index_documents("marketplace_products", docs)
    counts["marketplace_products"] = len(docs)

    return counts
