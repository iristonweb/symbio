"""Scheduled maintenance (Vercel Cron / external)."""

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import settings
from app.services.server_refresh import refresh_server_snapshots

router = APIRouter()


def _authorize_cron(authorization: str | None) -> None:
    secret = (settings.CRON_SECRET or "").strip()
    if not secret:
        return
    if authorization != f"Bearer {secret}":
        raise HTTPException(status_code=403, detail="Invalid cron authorization")


@router.get("/refresh-servers")
async def cron_refresh_servers(
    authorization: str | None = Header(default=None),
    limit: int = Query(default=300, ge=1, le=2000),
    db: AsyncSession = Depends(get_db),
):
    """Refresh live server snapshots (call every 15–30 min from Vercel Cron)."""
    _authorize_cron(authorization)
    stats = await refresh_server_snapshots(db, limit=limit)
    await db.commit()
    return {"ok": True, "stats": stats}
