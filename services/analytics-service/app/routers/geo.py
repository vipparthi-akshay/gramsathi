from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.metrics import GeoBreakdown, GeoHeatmapPoint
from app.services.bigquery_client import BigQueryClient
from app.utils.dependencies import get_admin_user, get_bigquery_client

router = APIRouter(prefix="/api/v1/analytics", tags=["Geographic Analytics"])


@router.get("/geo", response_model=list[GeoBreakdown])
async def get_geo_breakdown(
    level: str = Query("district", pattern="^(state|district)$"),
    state: str | None = Query(None),
    bq: BigQueryClient = Depends(get_bigquery_client),
    admin: dict = Depends(get_admin_user),
):
    try:
        return await bq.get_geo_breakdown(level, state)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch geo breakdown: {str(e)}",
        )


@router.get("/geo/heatmap", response_model=list[GeoHeatmapPoint])
async def get_geo_heatmap(
    state: str | None = Query(None),
    district: str | None = Query(None),
    bq: BigQueryClient = Depends(get_bigquery_client),
    admin: dict = Depends(get_admin_user),
):
    try:
        return await bq.get_geo_heatmap(state, district)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch geo heatmap data: {str(e)}",
        )
