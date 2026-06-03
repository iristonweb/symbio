from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.crud.servers import list_servers, get_server, create_server, claim_server, list_top_online
from app.db.models.user import User
from app.schemas.platform import ServerCreate, ClaimRequest

router = APIRouter()


@router.get("")
async def list_servers_route(
    game: str | None = Query(default=None),
    project_id: UUID | None = Query(default=None),
    sort: str = Query(default="online", pattern="^(online|rating|votes|rank|new|top_online)$"),
    fresh_minutes: int = Query(default=60, ge=0, le=180),
    q: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    if sort == "top_online":
        items = await list_top_online(db, game=game, fresh_minutes=fresh_minutes, limit=limit)
        return {"sort": sort, "fresh_minutes": fresh_minutes, "items": items}
    items = await list_servers(
        db,
        game=game,
        project_id=project_id,
        sort=sort,
        fresh_minutes=fresh_minutes,
        q=q,
        limit=limit,
        offset=offset,
    )
    return {"sort": sort, "fresh_minutes": fresh_minutes, "items": items, "limit": limit, "offset": offset}


@router.get("/{server_id}")
async def get_server_route(server_id: UUID, db: AsyncSession = Depends(get_db)):
    item = await get_server(db, server_id)
    if not item:
        raise HTTPException(status_code=404, detail="Server not found")
    return item


@router.post("")
async def create_server_route(
    body: ServerCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    s = await create_server(
        db,
        user.id,
        body.game,
        body.name,
        body.host,
        body.port,
        body.region,
        body.mode,
        body.description,
        body.project_id,
        body.tags,
    )
    await db.commit()
    return {"id": str(s.id), "slug": s.slug, "moderation_status": s.moderation_status}


@router.post("/claim")
async def claim_server_route(
    body: ClaimRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    s = await claim_server(db, body.server_id, user.id)
    if not s:
        raise HTTPException(status_code=404, detail="Server not found")
    await db.commit()
    return {"id": str(s.id), "claim_status": s.claim_status}
