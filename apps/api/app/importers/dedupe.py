from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.server import Server
from app.db.models.project import Project
from app.db.models.game import Game


async def find_server_by_host_port(db: AsyncSession, host: str, port: int) -> Server | None:
    return (
        await db.execute(select(Server).where(Server.host == host, Server.port == port))
    ).scalar_one_or_none()


async def find_server_by_source_id(db: AsyncSession, source_external_id: str) -> Server | None:
    if not source_external_id:
        return None
    return (
        await db.execute(select(Server).where(Server.source_external_id == source_external_id))
    ).scalar_one_or_none()


async def find_project_by_source_id(db: AsyncSession, source_external_id: str) -> Project | None:
    if not source_external_id:
        return None
    return (
        await db.execute(select(Project).where(Project.source_external_id == source_external_id))
    ).scalar_one_or_none()


async def find_game_by_slug(db: AsyncSession, slug: str) -> Game | None:
    return (await db.execute(select(Game).where(Game.slug == slug))).scalar_one_or_none()
