import argparse
import asyncio

from app.db.session import SessionLocal, engine
from sqlalchemy import text

async def _wait_for_db(max_attempts: int = 10) -> None:
    last_err: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return
        except Exception as e:
            last_err = e
            delay = min(0.5 * (2 ** (attempt - 1)), 8.0)
            print(f"[create_admin] DB not ready (attempt {attempt}/{max_attempts}): {e}")
            await asyncio.sleep(delay)
    if last_err:
        raise last_err
    raise RuntimeError("Database is not reachable.")

from app.db.crud.users import get_by_email, create_user
from app.core.security import hash_password

async def _run(email: str, password: str):
    async with SessionLocal() as db:
        existing = await get_by_email(db, email)
        if existing:
            print("Admin already exists:", email)
            return
        user = await create_user(
            db,
            email=email,
            hashed_password=hash_password(password),
            roles=["user", "admin", "moderator", "site_owner", "creator"],
            nickname="symbio-admin",
            email_verified=True,
        )
        await db.commit()
        print("Created admin:", user.email, "nickname:", user.nickname)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--email", required=True)
    p.add_argument("--password", required=True)
    args = p.parse_args()
    asyncio.run(_run(args.email, args.password))

if __name__ == "__main__":
    main()
