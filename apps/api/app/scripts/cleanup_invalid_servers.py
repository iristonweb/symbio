"""Remove imported servers with invalid host/port metadata."""
import asyncio
import re

from sqlalchemy import delete, select

from app.db.models.server import Server
from app.db.models.snapshot import ServerSnapshot
from app.db.session import SessionLocal
from app.importers.normalizers import is_valid_host_port


async def main() -> None:
    async with SessionLocal() as db:
        servers = (await db.execute(select(Server).where(Server.source_external_id.is_not(None)))).scalars().all()
        bad_ids = []
        for server in servers:
            if not is_valid_host_port(server.host, server.port):
                bad_ids.append(server.id)
            elif len(server.game or "") < 2 or not re.fullmatch(r"[\w-]+", server.game):
                bad_ids.append(server.id)
        if bad_ids:
            await db.execute(delete(ServerSnapshot).where(ServerSnapshot.server_id.in_(bad_ids)))
            await db.execute(delete(Server).where(Server.id.in_(bad_ids)))
            await db.commit()
        print(f"removed_invalid_servers={len(bad_ids)}")


if __name__ == "__main__":
    asyncio.run(main())
