from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.db.crud.games import list_games, get_game_by_slug
from app.schemas.platform import GameOut, GenreOut

router = APIRouter()


def _game_out(g) -> dict:
    return {
        "id": g.id,
        "slug": g.slug,
        "title": g.title,
        "category": g.category,
        "platforms": g.platforms,
        "short_description": g.short_description,
        "cover_url": g.cover_url,
        "rating": g.rating,
        "server_count": g.server_count,
        "genres": [{"slug": x.slug, "name": x.name} for x in (g.genres or [])],
    }


@router.get("")
async def get_games(
    category: str | None = Query(default=None),
    genre: str | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_games(db, category=category, genre=genre, q=q, limit=limit, offset=offset)
    return {"items": [_game_out(g) for g in items], "total": total, "limit": limit, "offset": offset}


@router.get("/{slug}")
async def get_game(slug: str, db: AsyncSession = Depends(get_db)):
    g = await get_game_by_slug(db, slug)
    if not g:
        raise HTTPException(status_code=404, detail="Game not found")
    return _game_out(g)
