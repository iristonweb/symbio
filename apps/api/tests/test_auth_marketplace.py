import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

pytestmark = pytest.mark.asyncio(loop_scope="session")


def _db_available() -> bool:
    try:
        import asyncio
        from sqlalchemy import text
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy.pool import NullPool
        from app.core.config import settings

        async def ping():
            engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            await engine.dispose()

        asyncio.run(ping())
        return True
    except Exception:
        return False


async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/health")
        assert r.status_code == 200


@pytest.mark.skipif(not _db_available(), reason="Postgres not available")
async def test_register_and_me():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        email = "pytest_user@symbio.dev"
        reg = await client.post(
            "/auth/register",
            json={"email": email, "password": "testpass123", "auto_nickname": True},
        )
        if reg.status_code == 409:
            login = await client.post(
                "/auth/login",
                json={"username": email, "password": "testpass123"},
            )
            token = login.json()["access_token"]
        else:
            assert reg.status_code == 200
            token = reg.json()["access_token"]
        me = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        data = me.json()
        assert "nickname" in data
        assert "capabilities" in data


@pytest.mark.skipif(not _db_available(), reason="Postgres not available")
async def test_marketplace_products_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/marketplace/products")
        assert r.status_code == 200
        assert "items" in r.json()
