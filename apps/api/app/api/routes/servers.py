from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.db.crud.servers import list_top_online

router = APIRouter()

@router.get("")
async def list_servers(
    game: str | None = Query(default=None),
    sort: str = Query(default="top_online", pattern="^(top_online)$"),
    fresh_minutes: int = Query(default=10, ge=0, le=180),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    if sort == "top_online":
        return {
            "sort": sort,
            "fresh_minutes": fresh_minutes,
            "items": await list_top_online(db, game=game, fresh_minutes=fresh_minutes, limit=limit),
        }
