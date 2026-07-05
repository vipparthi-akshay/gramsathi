import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.metrics import ExportRequest, ExportResponse, ExportStatus
from app.services.bigquery_client import BigQueryClient
from app.utils.dependencies import get_admin_user, get_bigquery_client

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics Export"])

# In-memory store for export jobs (use Redis in production)
_export_jobs: dict[str, dict] = {}


@router.post("/export", response_model=ExportResponse)
async def create_export(
    body: ExportRequest,
    bq: BigQueryClient = Depends(get_bigquery_client),
    admin: dict = Depends(get_admin_user),
):
    export_id = str(uuid.uuid4())
    job = {
        "export_id": export_id,
        "status": "processing",
        "format": body.format,
        "progress": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "sections": body.sections,
        "date_from": body.date_from,
        "date_to": body.date_to,
        "download_url": None,
        "error": None,
    }
    _export_jobs[export_id] = job

    try:
        data = {}
        if "overview" in body.sections:
            data["overview"] = (await bq.get_overview_kpis()).model_dump()
            job["progress"] = 25
        if "schemes" in body.sections:
            data["schemes"] = [s.model_dump() for s in await bq.get_scheme_analytics()]
            job["progress"] = 50
        if "geo" in body.sections:
            data["geo"] = [g.model_dump() for g in await bq.get_geo_breakdown("district")]
            job["progress"] = 75
        if "ai" in body.sections:
            data["ai"] = (await bq.get_ai_performance_metrics()).model_dump()
            job["progress"] = 100

        job["status"] = "completed"
        job["progress"] = 100
        job["download_url"] = f"/api/v1/analytics/exports/{export_id}/download"
    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)

    return ExportResponse(
        export_id=export_id,
        status=job["status"],
        format=body.format,
        download_url=job["download_url"],
        expires_at=job["expires_at"],
        created_at=job["created_at"],
    )


@router.get("/exports/{export_id}", response_model=ExportStatus)
async def get_export_status(
    export_id: str,
    admin: dict = Depends(get_admin_user),
):
    job = _export_jobs.get(export_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export job not found",
        )
    return ExportStatus(
        export_id=job["export_id"],
        status=job["status"],
        progress=job["progress"],
        download_url=job["download_url"],
        expires_at=job["expires_at"],
        error=job.get("error"),
    )


@router.get("/exports/{export_id}/download")
async def download_export(
    export_id: str,
    admin: dict = Depends(get_admin_user),
):
    job = _export_jobs.get(export_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export job not found",
        )
    if job["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Export is not yet completed",
        )
    if not job["download_url"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Download URL not available",
        )
    return {"download_url": job["download_url"]}
