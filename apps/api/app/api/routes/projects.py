from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.crud import billing as billing_crud
from app.db.crud.projects import list_projects, get_project_by_slug, create_project
from app.db.crud.servers import list_servers
from app.db.models.project import Project
from app.db.models.user import User
from app.schemas.platform import ProjectCreate, ProjectUpdate

router = APIRouter()


def _project_out(p):
    return {
        "id": str(p.id),
        "slug": p.slug,
        "name": p.name,
        "description": p.description,
        "links": p.links,
        "game_slugs": p.game_slugs,
        "rating": p.rating,
        "votes": p.votes,
        "online_total": p.online_total,
        "max_players_total": p.max_players_total,
        "source_url": p.source_url,
        "moderation_status": p.moderation_status,
    }


@router.get("")
async def get_projects(
    game: str | None = Query(default=None),
    sort: str = Query(default="rating", pattern="^(rating|votes|online)$"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_projects(db, game=game, sort=sort, limit=limit, offset=offset)
    return {
        "items": [_project_out(p) for p in items],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/mine")
async def get_my_projects(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    items = (
        await db.execute(select(Project).where(Project.owner_id == user.id).order_by(Project.created_at.desc()))
    ).scalars().all()
    return {"items": [_project_out(p) for p in items], "total": len(items)}


@router.get("/{slug}")
async def get_project(slug: str, db: AsyncSession = Depends(get_db)):
    p = await get_project_by_slug(db, slug)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    servers = await list_servers(db, project_id=p.id, limit=50)
    return {
        "id": str(p.id),
        "slug": p.slug,
        "name": p.name,
        "description": p.description,
        "links": p.links,
        "game_slugs": p.game_slugs,
        "rating": p.rating,
        "votes": p.votes,
        "online_total": p.online_total,
        "max_players_total": p.max_players_total,
        "source_url": p.source_url,
        "servers": servers,
    }


@router.post("")
async def post_project(
    body: ProjectCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    allowed, reason = await billing_crud.can_create_project(db, user.id)
    if not allowed:
        raise HTTPException(status_code=403, detail=reason or "Project limit reached")
    p = await create_project(db, user.id, body.name, body.description, body.game_slugs, body.links)
    await db.commit()
    return {"id": str(p.id), "slug": p.slug, "moderation_status": p.moderation_status}


@router.patch("/{project_id}")
async def patch_project(
    project_id: UUID,
    body: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    p = (await db.execute(select(Project).where(Project.id == project_id))).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    if p.owner_id != user.id and "admin" not in (user.roles or []):
        raise HTTPException(status_code=403, detail="Project is not owned by user")
    if body.name is not None:
        p.name = body.name
    if body.description is not None:
        p.description = body.description
    if body.game_slugs is not None:
        p.game_slugs = body.game_slugs
    if body.links is not None:
        p.links = body.links
    p.moderation_status = "pending"
    await db.commit()
    return _project_out(p)


@router.delete("/{project_id}")
async def delete_project(
    project_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.db.models.server import Server

    p = (await db.execute(select(Project).where(Project.id == project_id))).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    if p.owner_id != user.id and "admin" not in (user.roles or []):
        raise HTTPException(status_code=403, detail="Project is not owned by user")
    servers = (await db.execute(select(Server).where(Server.project_id == p.id))).scalars().all()
    for server in servers:
        server.project_id = None
    await db.delete(p)
    await db.commit()
    return {"deleted": True}
