from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.db.crud.articles import list_articles, get_article_by_slug

router = APIRouter()


@router.get("")
async def get_articles(
    type: str | None = Query(default=None, alias="type"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_articles(db, article_type=type, limit=limit, offset=offset)
    return {
        "items": [
            {
                "id": str(a.id),
                "slug": a.slug,
                "title": a.title,
                "excerpt": a.excerpt,
                "article_type": a.article_type,
                "tags": a.tags,
                "game_slug": a.game_slug,
                "published_at": a.published_at.isoformat() if a.published_at else None,
            }
            for a in items
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{slug}")
async def get_article(slug: str, db: AsyncSession = Depends(get_db)):
    a = await get_article_by_slug(db, slug)
    if not a:
        raise HTTPException(status_code=404, detail="Article not found")
    return {
        "id": str(a.id),
        "slug": a.slug,
        "title": a.title,
        "excerpt": a.excerpt,
        "body": a.body,
        "article_type": a.article_type,
        "tags": a.tags,
        "game_slug": a.game_slug,
        "published_at": a.published_at.isoformat() if a.published_at else None,
        "source_url": a.source_url,
    }
