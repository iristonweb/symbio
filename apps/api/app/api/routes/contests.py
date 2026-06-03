from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.crud.contests import list_contests, get_contest_by_slug, join_contest
from app.db.models.user import User

router = APIRouter()


@router.get("")
async def get_contests(db: AsyncSession = Depends(get_db)):
    items = await list_contests(db, status="active")
    return {
        "items": [
            {
                "id": str(c.id),
                "slug": c.slug,
                "title": c.title,
                "description": c.description,
                "prize_summary": c.prize_summary,
                "prize_credits": c.prize_credits,
                "prize_premium_days": c.prize_premium_days,
                "status": c.status,
                "starts_at": c.starts_at.isoformat() if c.starts_at else None,
                "ends_at": c.ends_at.isoformat() if c.ends_at else None,
            }
            for c in items
        ]
    }


@router.get("/{slug}")
async def get_contest(slug: str, db: AsyncSession = Depends(get_db)):
    c = await get_contest_by_slug(db, slug)
    if not c:
        raise HTTPException(status_code=404, detail="Contest not found")
    return {
        "id": str(c.id),
        "slug": c.slug,
        "title": c.title,
        "description": c.description,
        "prize_summary": c.prize_summary,
        "status": c.status,
    }


@router.post("/{contest_id}/join")
async def post_join(
    contest_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = await join_contest(db, contest_id, user.id)
    await db.commit()
    return {"status": entry.status, "contest_id": str(contest_id)}
