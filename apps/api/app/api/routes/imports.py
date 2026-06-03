from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.rbac import require_role
from app.db.models.import_job import ImportJob
from app.db.models.user import User
from app.importers.wargm_public import run_import
from app.importers.jobs import reindex_all
from app.schemas.platform import ImportRunRequest

router = APIRouter()


@router.post("/wargm/dry-run")
async def dry_run_wargm(
    body: ImportRunRequest,
    user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    job = await run_import(
        db,
        dry_run=True,
        started_by=user.id,
        limit_games=body.limit_games,
        limit_projects=body.limit_projects,
        limit_servers=body.limit_servers,
    )
    await db.commit()
    return {"job_id": str(job.id), "status": job.status, "stats": job.stats, "dry_run": True}


@router.post("/wargm/run")
async def run_wargm(
    body: ImportRunRequest,
    user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    job = await run_import(
        db,
        dry_run=body.dry_run,
        started_by=user.id,
        limit_games=body.limit_games,
        limit_projects=body.limit_projects,
        limit_servers=body.limit_servers,
    )
    await db.commit()
    if not body.dry_run and job.status == "completed":
        await reindex_all(db)
    return {"job_id": str(job.id), "status": job.status, "stats": job.stats, "error": job.error}


@router.get("/{job_id}")
async def get_import_job(
    job_id: UUID,
    user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    job = (await db.execute(select(ImportJob).where(ImportJob.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")
    return {
        "id": str(job.id),
        "source": job.source,
        "status": job.status,
        "dry_run": job.dry_run,
        "stats": job.stats,
        "error": job.error,
        "created_at": job.created_at.isoformat(),
        "finished_at": job.finished_at.isoformat() if job.finished_at else None,
    }


@router.post("/reindex")
async def post_reindex(
    user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    counts = await reindex_all(db)
    return {"indexed": counts}
