from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.rbac import require_role
from app.db.crud.projects import list_projects, get_project_by_slug, create_project
from app.db.crud.servers import list_servers
from app.db.models.user import User
from app.schemas.platform import ProjectCreate

router = APIRouter()


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
        "items": [
            {
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
            }
            for p in items
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


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
    p = await create_project(db, user.id, body.name, body.description, body.game_slugs, body.links)
    await db.commit()
    return {"id": str(p.id), "slug": p.slug, "moderation_status": p.moderation_status}
