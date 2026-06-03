from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.crud import billing as billing_crud
from app.db.models.server import Server
from app.db.models.snapshot import ServerSnapshot
from app.db.crud.servers import list_servers, get_server, create_server, claim_server, list_top_online
from app.db.crud import votes as votes_crud
from app.db.crud import referrals as referrals_crud
from app.db.models.user import User
from app.schemas.platform import ServerCreate, ServerUpdate, ClaimRequest, VoteResponse

router = APIRouter()


@router.get("")
async def list_servers_route(
    game: str | None = Query(default=None),
    project_id: UUID | None = Query(default=None),
    sort: str = Query(default="online", pattern="^(online|rating|votes|rank|new|top_online)$"),
    fresh_minutes: int = Query(default=10080, ge=0, le=10080),
    q: str | None = Query(default=None),
    style: str | None = Query(default=None),
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
        style=style,
        limit=limit,
        offset=offset,
    )
    return {"sort": sort, "fresh_minutes": fresh_minutes, "items": items, "limit": limit, "offset": offset}


@router.get("/mine")
async def get_my_servers(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(select(Server).where(Server.owner_id == user.id).order_by(Server.created_at.desc()))
    ).scalars().all()
    items = []
    for server in rows:
        item = await get_server(db, server.id)
        if item:
            items.append(item)
    return {"items": items, "total": len(items)}


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
    allowed, reason = await billing_crud.can_create_server(db, user.id, body.project_id)
    if not allowed:
        raise HTTPException(status_code=403, detail=reason or "Server limit reached")
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


@router.patch("/{server_id}")
async def patch_server_route(
    server_id: UUID,
    body: ServerUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    server = (await db.execute(select(Server).where(Server.id == server_id))).scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    if server.owner_id != user.id and "admin" not in (user.roles or []):
        raise HTTPException(status_code=403, detail="Server is not owned by user")
    if body.project_id is not None:
        from app.db.models.project import Project

        project = (
            await db.execute(select(Project).where(Project.id == body.project_id, Project.owner_id == user.id))
        ).scalar_one_or_none()
        if not project and "admin" not in (user.roles or []):
            raise HTTPException(status_code=403, detail="Project is not owned by user")
    for field in ("game", "name", "host", "port", "region", "mode", "description", "project_id", "tags"):
        value = getattr(body, field)
        if value is not None:
            setattr(server, field, value)
    if body.host is not None or body.port is not None:
        server.join_url = f"{server.host}:{server.port}"
    server.moderation_status = "pending"
    await db.commit()
    return await get_server(db, server.id)


@router.delete("/{server_id}")
async def delete_server_route(
    server_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    server = (await db.execute(select(Server).where(Server.id == server_id))).scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    if server.owner_id != user.id and "admin" not in (user.roles or []):
        raise HTTPException(status_code=403, detail="Server is not owned by user")
    await db.execute(delete(ServerSnapshot).where(ServerSnapshot.server_id == server.id))
    await db.delete(server)
    await db.commit()
    return {"deleted": True}


@router.post("/{server_id}/vote", response_model=VoteResponse)
async def vote_server_route(
    server_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    server_row = (await db.execute(select(Server).where(Server.id == server_id))).scalar_one_or_none()
    if not server_row:
        raise HTTPException(status_code=404, detail="Server not found")
    try:
        result = await votes_crud.cast_server_vote(
            db,
            user.id,
            server_id,
            email_verified=user.email_verified,
            user_created_at=user.created_at,
            server_owner_id=server_row.owner_id,
        )
    except votes_crud.VoteError as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
    await referrals_crud.qualify_referral_on_action(db, user.id)
    await db.commit()
    return result


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
