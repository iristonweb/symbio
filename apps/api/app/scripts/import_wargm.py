"""Run WARGM metadata import against the configured DATABASE_URL."""
from __future__ import annotations

import argparse
import asyncio

from app.core.config import settings
from app.db.session import SessionLocal
from app.importers.jobs import reindex_all
from app.importers.wargm_public import run_import


async def main() -> None:
    parser = argparse.ArgumentParser(description="Import public WARGM metadata into SYMBIO")
    parser.add_argument("--dry-run", action="store_true", help="Parse sources without writing to DB")
    parser.add_argument("--limit-games", type=int, default=50)
    parser.add_argument("--limit-projects", type=int, default=100)
    parser.add_argument("--limit-servers", type=int, default=200)
    parser.add_argument("--reindex", action="store_true", help="Reindex Meilisearch after a successful import")
    args = parser.parse_args()

    db_label = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL
    print(f"database: {db_label}")
    print(
        f"mode: {'dry-run' if args.dry_run else 'write'} | "
        f"games={args.limit_games} projects={args.limit_projects} servers={args.limit_servers}"
    )

    async with SessionLocal() as session:
        job = await run_import(
            session,
            dry_run=args.dry_run,
            limit_games=args.limit_games,
            limit_projects=args.limit_projects,
            limit_servers=args.limit_servers,
        )
        await session.commit()
        print(f"status: {job.status}")
        print(f"stats: {job.stats}")
        if job.error:
            print(f"error: {job.error}")
            raise SystemExit(1)

        if args.reindex and not args.dry_run and job.status == "completed":
            counts = await reindex_all(session)
            print(f"reindex: {counts}")


if __name__ == "__main__":
    asyncio.run(main())
