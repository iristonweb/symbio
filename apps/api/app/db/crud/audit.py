from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.audit import AuditLog

async def add_audit(db: AsyncSession, actor_user_id, action: str, entity_type: str, entity_id: str, meta: dict):
    row = AuditLog(actor_user_id=actor_user_id, action=action, entity_type=entity_type, entity_id=entity_id, meta=meta or {})
    db.add(row)
    await db.commit()

async def list_audit(db: AsyncSession, limit: int = 100):
    res = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    return list(res.scalars().all())
