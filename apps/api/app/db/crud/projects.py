import re
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.project import Project


def slugify(name: str) -> str:
    s = re.sub(r"[^\w\s-]", "", name.lower())
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s[:160] or "project"


async def list_projects(
    db: AsyncSession,
    game: str | None = None,
    sort: str = "rating",
    limit: int = 50,
    offset: int = 0,
):
    stmt = select(Project).where(Project.moderation_status == "approved")
    if game:
        stmt = stmt.where(Project.game_slugs.contains([game]))
    order = {
        "rating": Project.rating.desc(),
        "votes": Project.votes.desc(),
        "online": Project.online_total.desc(),
    }.get(sort, Project.rating.desc())
    stmt = stmt.order_by(order).offset(offset).limit(limit)
    total_stmt = select(func.count(Project.id)).where(Project.moderation_status == "approved")
    if game:
        total_stmt = total_stmt.where(Project.game_slugs.contains([game]))
    total = (await db.execute(total_stmt)).scalar_one()
    items = (await db.execute(stmt)).scalars().all()
    return items, int(total)


async def get_project_by_slug(db: AsyncSession, slug: str) -> Project | None:
    return (await db.execute(select(Project).where(Project.slug == slug))).scalar_one_or_none()


async def create_project(db: AsyncSession, owner_id: UUID, name: str, description: str | None, game_slugs: list, links: dict) -> Project:
    base_slug = slugify(name)
    slug = base_slug
    n = 1
    while (await db.execute(select(Project).where(Project.slug == slug))).scalar_one_or_none():
        slug = f"{base_slug}-{n}"
        n += 1
    p = Project(
        owner_id=owner_id,
        slug=slug,
        name=name,
        description=description,
        game_slugs=game_slugs,
        links=links,
        moderation_status="pending",
    )
    db.add(p)
    await db.flush()
    return p
