from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.user import User

async def get_by_email(db: AsyncSession, email: str) -> User | None:
    res = await db.execute(select(User).where(User.email == email))
    return res.scalar_one_or_none()

async def create_user(db: AsyncSession, email: str, hashed_password: str, roles: list[str]) -> User:
    user = User(email=email, hashed_password=hashed_password, roles=roles)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
