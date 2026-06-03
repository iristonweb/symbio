"""Refresh live server snapshots via A2S/mcstatus.

Run from apps/api:
  python -m app.scripts.refresh_server_snapshots --limit 300
"""
from __future__ import annotations

import argparse
import asyncio

from app.db.session import SessionLocal
from app.importers.jobs import reindex_all
from app.services.server_refresh import refresh_server_snapshots


async def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh SYMBIO server online snapshots")
    parser.add_argument("--limit", type=int, default=200)
    parser.add_argument("--reindex", action="store_true")
    args = parser.parse_args()

    async with SessionLocal() as session:
        stats = await refresh_server_snapshots(session, limit=args.limit)
        await session.commit()
        print(f"refresh_server_snapshots: {stats}")
        if args.reindex:
            counts = await reindex_all(session)
            print(f"reindex: {counts}")


if __name__ == "__main__":
    asyncio.run(main())
