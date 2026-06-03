from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.services.nickname import ensure_unique_nickname


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    res = await db.execute(select(User).where(User.email == email))
    return res.scalar_one_or_none()


async def get_by_id(db: AsyncSession, user_id: UUID) -> User | None:
    res = await db.execute(select(User).where(User.id == user_id))
    return res.scalar_one_or_none()


async def get_by_nickname(db: AsyncSession, nickname: str) -> User | None:
    res = await db.execute(select(User).where(User.nickname == nickname))
    return res.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    *,
    email: str,
    hashed_password: str | None,
    roles: list[str],
    nickname: str | None = None,
    display_name: str | None = None,
    email_verified: bool = False,
) -> User:
    nick = await ensure_unique_nickname(db, nickname)
    user = User(
        email=email.lower().strip(),
        hashed_password=hashed_password,
        roles=roles,
        nickname=nick,
        display_name=display_name or nick,
        email_verified=email_verified,
        email_verified_at=datetime.now(timezone.utc) if email_verified else None,
    )
    db.add(user)
    await db.flush()
    return user


async def update_user_profile(
    db: AsyncSession,
    user: User,
    *,
    display_name: str | None = None,
    bio: str | None = None,
    avatar_url: str | None = None,
    locale: str | None = None,
) -> User:
    if display_name is not None:
        user.display_name = display_name
    if bio is not None:
        user.bio = bio
    if avatar_url is not None:
        user.avatar_url = avatar_url
    if locale is not None:
        user.locale = locale
    user.updated_at = datetime.now(timezone.utc)
    return user


async def touch_login(db: AsyncSession, user: User) -> None:
    user.last_login_at = datetime.now(timezone.utc)
    user.updated_at = datetime.now(timezone.utc)


async def list_users(db: AsyncSession, limit: int = 100) -> list[User]:
    return (await db.execute(select(User).order_by(User.created_at.desc()).limit(limit))).scalars().all()
