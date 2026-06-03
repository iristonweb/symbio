"""Resolve Steam app IDs against SYMBIO games catalog."""

from __future__ import annotations

from sqlalchemy import cast, select, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.game import Game
from app.services.steam_app_map import slug_for_appid


async def resolve_symbio_slug_for_appid(db: AsyncSession, appid: int) -> str | None:
    static = slug_for_appid(appid)
    if static:
        game = (
            await db.execute(select(Game.slug).where(Game.slug == static).limit(1))
        ).scalar_one_or_none()
        if game:
            return static

    needle = str(appid)
    rows = (
        await db.execute(
            select(Game.slug).where(cast(Game.source_meta, String).ilike(f"%{needle}%")).limit(5)
        )
    ).scalars().all()
    return rows[0] if rows else static
