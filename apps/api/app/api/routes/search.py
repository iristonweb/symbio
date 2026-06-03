from fastapi import APIRouter, Query

from app.services.search import search as meili_search

router = APIRouter()


@router.get("")
async def global_search(
    q: str = Query(min_length=1),
    index: str = Query(default="servers", pattern="^(games|projects|servers|articles)$"),
    limit: int = Query(default=20, ge=1, le=50),
):
    hits = await meili_search(index, q, limit=limit)
    return {"index": index, "q": q, "hits": hits}
