import re
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.server import Server
from app.db.models.snapshot import ServerSnapshot


def _snapshot_to_dict(snap: ServerSnapshot) -> dict:
    return {
        "online": snap.online,
        "max_players": snap.max_players,
        "status": snap.status,
        "map": snap.map,
        "version": snap.version,
        "ping": snap.ping,
        "uptime_percent": snap.uptime_percent,
        "rank": snap.rank,
        "rank_delta": snap.rank_delta,
        "created_at": snap.created_at.isoformat(),
    }


def _server_to_dict(server: Server, snap: ServerSnapshot | None) -> dict:
    return {
        "id": str(server.id),
        "game": server.game,
        "name": server.name,
        "slug": server.slug,
        "host": server.host,
        "port": server.port,
        "join_url": server.join_url,
        "region": server.region,
        "mode": server.mode,
        "description": server.description,
        "links": server.links,
        "tags": server.tags,
        "rating": server.rating,
        "votes": server.votes,
        "claim_status": server.claim_status,
        "project_id": str(server.project_id) if server.project_id else None,
        "source_url": server.source_url,
        "snapshot": _snapshot_to_dict(snap) if snap else None,
    }


async def _latest_snapshots_subquery():
    return (
        select(ServerSnapshot.server_id, func.max(ServerSnapshot.created_at).label("max_created_at"))
        .group_by(ServerSnapshot.server_id)
        .subquery()
    )


async def list_servers(
    db: AsyncSession,
    game: str | None = None,
    project_id: UUID | None = None,
    sort: str = "online",
    fresh_minutes: int = 60,
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    sub = await _latest_snapshots_subquery()
    q_stmt = (
        select(Server, ServerSnapshot)
        .join(sub, sub.c.server_id == Server.id)
        .join(
            ServerSnapshot,
            (ServerSnapshot.server_id == Server.id) & (ServerSnapshot.created_at == sub.c.max_created_at),
        )
        .where(Server.moderation_status == "approved")
    )
    if game:
        q_stmt = q_stmt.where(Server.game == game)
    if project_id:
        q_stmt = q_stmt.where(Server.project_id == project_id)
    if q:
        q_stmt = q_stmt.where(Server.name.ilike(f"%{q}%"))
    if fresh_minutes > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=fresh_minutes)
        q_stmt = q_stmt.where(ServerSnapshot.created_at >= cutoff)

    order_map = {
        "online": ServerSnapshot.online.desc(),
        "rating": Server.rating.desc(),
        "votes": Server.votes.desc(),
        "rank": ServerSnapshot.rank.asc().nullslast(),
        "new": Server.created_at.desc(),
    }
    q_stmt = q_stmt.order_by(order_map.get(sort, ServerSnapshot.online.desc())).offset(offset).limit(limit)
    rows = (await db.execute(q_stmt)).all()
    return [_server_to_dict(s, snap) for s, snap in rows]


async def get_server(db: AsyncSession, server_id: UUID) -> dict | None:
    server = (await db.execute(select(Server).where(Server.id == server_id))).scalar_one_or_none()
    if not server:
        return None
    snap = (
        await db.execute(
            select(ServerSnapshot)
            .where(ServerSnapshot.server_id == server_id)
            .order_by(ServerSnapshot.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    return _server_to_dict(server, snap)


async def list_top_online(db: AsyncSession, game: str | None, fresh_minutes: int, limit: int = 50):
    return await list_servers(db, game=game, sort="online", fresh_minutes=fresh_minutes, limit=limit)


async def create_server(
    db: AsyncSession,
    owner_id: UUID,
    game: str,
    name: str,
    host: str,
    port: int,
    region: str | None,
    mode: str | None,
    description: str | None,
    project_id: UUID | None,
    tags: dict,
) -> Server:
    slug = re.sub(r"[\s_-]+", "-", name.lower())[:200]
    s = Server(
        owner_id=owner_id,
        game=game,
        name=name,
        slug=slug,
        host=host,
        port=port,
        join_url=f"{host}:{port}",
        region=region,
        mode=mode,
        description=description,
        project_id=project_id,
        tags=tags,
        claim_status="claimed",
        moderation_status="pending",
    )
    db.add(s)
    await db.flush()
    db.add(ServerSnapshot(server_id=s.id, online=0, max_players=100, status="offline"))
    return s


async def claim_server(db: AsyncSession, server_id: UUID, user_id: UUID) -> Server | None:
    server = (await db.execute(select(Server).where(Server.id == server_id))).scalar_one_or_none()
    if not server:
        return None
    if server.claim_status == "verified":
        return server
    server.owner_id = user_id
    server.claim_status = "claimed"
    return server


async def seed_demo_server(db: AsyncSession):
    pass
