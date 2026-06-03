"""Re-run platform seed (articles, games, marketplace, demo server) without recreating tables."""
import asyncio

from app.db.session import SessionLocal
from app.db.seed_platform import seed_platform


async def main() -> None:
  async with SessionLocal() as session:
    await seed_platform(session)
    await session.commit()
  print("seed_platform: done")


if __name__ == "__main__":
  asyncio.run(main())
