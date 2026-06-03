import argparse
import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.db.crud.users import create_user, get_by_email
from app.db.models.billing import Wallet
from app.db.session import SessionLocal


ADMIN_ROLES = ["user", "admin", "moderator", "site_owner", "creator"]


async def _run(email: str, password: str, nickname: str | None) -> None:
    async with SessionLocal() as db:
        user = await get_by_email(db, email)
        if user:
            user.hashed_password = hash_password(password)
            user.roles = ADMIN_ROLES
            user.email_verified = True
            user.is_active = True
            action = "Updated"
        else:
            user = await create_user(
                db,
                email=email,
                hashed_password=hash_password(password),
                roles=ADMIN_ROLES,
                nickname=nickname,
                display_name=nickname,
                email_verified=True,
            )
            action = "Created"

        wallet = (await db.execute(select(Wallet).where(Wallet.user_id == user.id))).scalar_one_or_none()
        if not wallet:
            db.add(Wallet(user_id=user.id, balance_credits=50))

        await db.commit()
        print(f"{action} admin: {user.email} ({user.nickname})")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--nickname", default=None)
    args = parser.parse_args()
    asyncio.run(_run(args.email, args.password, args.nickname))


if __name__ == "__main__":
    main()
