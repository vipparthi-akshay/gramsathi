from fastapi import APIRouter, Depends, HTTPException, status

from app.models.metrics import AIMetrics, LanguageStats
from app.services.bigquery_client import BigQueryClient
from app.utils.dependencies import get_admin_user, get_bigquery_client

router = APIRouter(prefix="/api/v1/analytics", tags=["AI Analytics"])


@router.get("/ai-performance", response_model=AIMetrics)
async def get_ai_performance_metrics(
    bq: BigQueryClient = Depends(get_bigquery_client),
    admin: dict = Depends(get_admin_user),
):
    try:
        return await bq.get_ai_performance_metrics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch AI performance metrics: {str(e)}",
        )


@router.get("/ai/languages", response_model=list[LanguageStats])
async def get_language_stats(
    bq: BigQueryClient = Depends(get_bigquery_client),
    admin: dict = Depends(get_admin_user),
):
    try:
        return await bq.get_language_stats()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch language stats: {str(e)}",
        )
