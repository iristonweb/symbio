from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.rbac import require_role
from app.db.models.user import User
from app.db.crud.audit import list_audit

router = APIRouter()

@router.get("/audit")
async def get_audit(
    limit: int = Query(default=100, ge=1, le=500),
    _: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    rows = await list_audit(db, limit=limit)
    return {
        "items": [
            {
                "id": str(r.id),
                "actor_user_id": str(r.actor_user_id) if r.actor_user_id else None,
                "action": r.action,
                "entity_type": r.entity_type,
                "entity_id": r.entity_id,
                "meta": r.meta,
                "created_at": r.created_at.isoformat(),
            } for r in rows
        ]
    }
