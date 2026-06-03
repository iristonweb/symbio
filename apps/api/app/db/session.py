from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={
        # asyncpg supports `timeout` (seconds) for connect operations
        "timeout": 15,
        # keep server-side statement timeout conservative for dev
        "server_settings": {"statement_timeout": "15000"},
    },
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
