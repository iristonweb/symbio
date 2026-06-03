from datetime import datetime, timedelta, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.server import Server
from app.db.models.snapshot import ServerSnapshot

async def list_top_online(db: AsyncSession, game: str | None, fresh_minutes: int, limit: int = 50):
    # Subquery: latest snapshot per server
    sub = (
        select(ServerSnapshot.server_id, func.max(ServerSnapshot.created_at).label("max_created_at"))
        .group_by(ServerSnapshot.server_id)
        .subquery()
    )

    q = (
        select(Server, ServerSnapshot)
        .join(sub, sub.c.server_id == Server.id)
        .join(ServerSnapshot, (ServerSnapshot.server_id == Server.id) & (ServerSnapshot.created_at == sub.c.max_created_at))
    )

    if game:
        q = q.where(Server.game == game)

    if fresh_minutes > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=fresh_minutes)
        q = q.where(ServerSnapshot.created_at >= cutoff)

    q = q.order_by(ServerSnapshot.online.desc()).limit(limit)

    res = await db.execute(q)
    rows = []
    for server, snap in res.all():
        rows.append({
            "id": str(server.id),
            "game": server.game,
            "name": server.name,
            "host": server.host,
            "port": server.port,
            "region": server.region,
            "mode": server.mode,
            "claim_status": server.claim_status,
            "tags": server.tags,
            "snapshot": {
                "online": snap.online,
                "max_players": snap.max_players,
                "map": snap.map,
                "version": snap.version,
                "tags": snap.tags,
                "ping": snap.ping,
                "created_at": snap.created_at.isoformat(),
            }
        })
    return rows

async def seed_demo(db: AsyncSession):
    # Create a demo server + snapshot if none exist
    count = (await db.execute(select(func.count(Server.id)))).scalar_one()
    if count and int(count) > 0:
        return

    s = Server(game="demo-game", name="SYMBIO Demo Server", host="127.0.0.1", port=27015, region="NA", mode="PvP", tags={"featured": True})
    db.add(s)
    await db.commit()
    await db.refresh(s)

    snap = ServerSnapshot(server_id=s.id, online=42, max_players=100, map="arena", version="1.0.0", tags={"wipe": "weekly"}, ping=25)
    db.add(snap)
    await db.commit()
