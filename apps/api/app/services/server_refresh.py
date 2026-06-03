"""Refresh live server snapshots from public server query protocols."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.server import Server
from app.db.models.snapshot import ServerSnapshot
from app.importers.fallback_sources import enrich_server_live
from app.importers.normalizers import is_valid_host_port


async def refresh_server_snapshots(db: AsyncSession, *, limit: int = 200) -> dict:
    servers = (
        await db.execute(
            select(Server)
            .where(Server.moderation_status == "approved")
            .order_by(Server.created_at.desc())
            .limit(limit)
        )
    ).scalars().all()

    stats = {"checked": 0, "updated": 0, "offline": 0, "skipped": 0}

    for server in servers:
        if not is_valid_host_port(server.host, server.port):
            stats["skipped"] += 1
            continue

        stats["checked"] += 1
        live = await enrich_server_live(server.host, server.port, server.game)
        latest = (
            await db.execute(
                select(ServerSnapshot)
                .where(ServerSnapshot.server_id == server.id)
                .order_by(ServerSnapshot.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        if live:
            online = int(live.get("online") or 0)
            max_players = int(live.get("max_players") or 0)
            snapshot = ServerSnapshot(
                server_id=server.id,
                online=online,
                max_players=max_players,
                status="online" if online > 0 or max_players > 0 else "offline",
                map=live.get("map") or (latest.map if latest else None),
                version=live.get("version") or (latest.version if latest else None),
                rank=latest.rank if latest else None,
                uptime_percent=latest.uptime_percent if latest else None,
                tags=latest.tags if latest else {},
                created_at=datetime.now(timezone.utc),
            )
            db.add(snapshot)
            stats["updated"] += 1
        elif latest:
            snapshot = ServerSnapshot(
                server_id=server.id,
                online=0,
                max_players=latest.max_players,
                status="offline",
                map=latest.map,
                version=latest.version,
                rank=latest.rank,
                uptime_percent=latest.uptime_percent,
                tags=latest.tags,
                created_at=datetime.now(timezone.utc),
            )
            db.add(snapshot)
            stats["offline"] += 1
        else:
            stats["skipped"] += 1

    await db.flush()
    return stats
