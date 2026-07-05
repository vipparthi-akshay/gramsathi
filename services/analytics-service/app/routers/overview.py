from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.metrics import OverviewKPIs, RealtimeMetrics, TrendDataPoint
from app.services.bigquery_client import BigQueryClient
from app.utils.dependencies import get_admin_user, get_bigquery_client

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics Overview"])


@router.get("/overview", response_model=OverviewKPIs)
async def get_overview_kpis(
    bq: BigQueryClient = Depends(get_bigquery_client),
    admin: dict = Depends(get_admin_user),
):
    try:
        return await bq.get_overview_kpis()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch overview KPIs: {str(e)}",
        )


@router.get("/realtime", response_model=RealtimeMetrics)
async def get_realtime_metrics(
    bq: BigQueryClient = Depends(get_bigquery_client),
    admin: dict = Depends(get_admin_user),
):
    try:
        return await bq.get_realtime_metrics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch realtime metrics: {str(e)}",
        )


@router.get("/trends", response_model=list[TrendDataPoint])
async def get_trend_data(
    period: str = Query("30d", pattern="^(7d|30d|90d|1y)$"),
    bq: BigQueryClient = Depends(get_bigquery_client),
    admin: dict = Depends(get_admin_user),
):
    days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    days = days_map[period]
    try:
        return await bq.get_trend_data(days)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch trend data: {str(e)}",
        )
