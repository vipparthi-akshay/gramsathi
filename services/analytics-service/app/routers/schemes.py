from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.metrics import SchemeAnalytics, SchemeDeepAnalytics
from app.services.bigquery_client import BigQueryClient
from app.utils.dependencies import get_admin_user, get_bigquery_client

router = APIRouter(prefix="/api/v1/analytics", tags=["Scheme Analytics"])


@router.get("/schemes", response_model=list[SchemeAnalytics])
async def get_scheme_analytics(
    category: str | None = Query(None),
    sort_by: str = Query("total_applications", pattern="^(total_applications|approval_rate|avg_processing_time_days|benefits_disbursed)$"),
    limit: int = Query(10, ge=1, le=100),
    bq: BigQueryClient = Depends(get_bigquery_client),
    admin: dict = Depends(get_admin_user),
):
    try:
        results = await bq.get_scheme_analytics()
        if category:
            results = [r for r in results if r.category == category]
        reverse = sort_by != "avg_processing_time_days"
        results.sort(key=lambda r: getattr(r, sort_by, 0) or 0, reverse=reverse)
        return results[:limit]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch scheme analytics: {str(e)}",
        )


@router.get("/schemes/{scheme_id}", response_model=SchemeDeepAnalytics)
async def get_scheme_deep_analytics(
    scheme_id: str,
    bq: BigQueryClient = Depends(get_bigquery_client),
    admin: dict = Depends(get_admin_user),
):
    try:
        result = await bq.get_scheme_deep_analytics(scheme_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scheme {scheme_id} not found or has no data",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch scheme deep analytics: {str(e)}",
        )
