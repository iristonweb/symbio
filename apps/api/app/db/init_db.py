import asyncio
import time
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.db.session import engine, AsyncSessionLocal
from app.db.base import Base
from app.db.crud.servers import seed_demo_server


async def _wait_for_db(timeout: float = 30.0) -> None:
  start = time.time()
  last_err: Exception | None = None
  while time.time() - start < timeout:
    try:
      async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
        return
    except Exception as e:  # pragma: no cover
      last_err = e
      await asyncio.sleep(1.0)
  raise RuntimeError(f"Database not ready after {timeout:.0f}s: {last_err!r}")


async def init_db() -> None:
  await _wait_for_db()

  # Creating tables may fail if postgres is still coming up (especially on Windows + Docker).
  # Retry a few times and dispose the pool between attempts.
  last_err: Exception | None = None
  for attempt in range(1, 6):
    try:
      async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
      last_err = None
      break
    except (OperationalError, Exception) as e:  # pragma: no cover
      last_err = e
      await engine.dispose()
      await asyncio.sleep(min(1.0 * attempt, 5.0))

  if last_err is not None:
    raise RuntimeError(
      "Failed to initialize database. "
      "Make sure Docker postgres is running and DATABASE_URL points to 127.0.0.1:5432. "
      f"Last error: {last_err!r}"
    )

  # Seed minimal demo data (idempotent).
  async with AsyncSessionLocal() as session:
    await seed_demo_server(session)
    await session.commit()


if __name__ == "__main__":
  asyncio.run(init_db())
