from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.db.models.user import User
from app.db.models.event import EventLog
from app.db.crud.audit import add_audit

router = APIRouter()

class EventIn(BaseModel):
    name: str
    session_id: str | None = None
    props: dict = {}

@router.post("/track")
async def track_event(
    payload: EventIn,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    row = EventLog(name=payload.name, user_id=user.id if user else None, session_id=payload.session_id, props=payload.props or {})
    db.add(row)
    await db.commit()
    await add_audit(db, actor_user_id=user.id if user else None, action="event.track", entity_type="event", entity_id=str(row.id), meta={"name": payload.name})
    return {"ok": True}
