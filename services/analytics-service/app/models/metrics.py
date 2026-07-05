from typing import Optional

from pydantic import BaseModel, Field


class OverviewKPIs(BaseModel):
    total_citizens: int = 0
    total_applications: int = 0
    approval_rate: float = 0.0
    benefits_disbursed: float = 0.0
    active_schemes: int = 0
    avg_processing_time_days: float = 0.0
    citizen_satisfaction: float = 0.0


class RealtimeMetrics(BaseModel):
    active_sessions: int = 0
    applications_today: int = 0
    ai_conversations_today: int = 0
    docs_processed_today: int = 0
    grievances_today: int = 0
    otp_verified_today: int = 0


class TrendDataPoint(BaseModel):
    date: str
    applications: int = 0
    approvals: int = 0
    rejections: int = 0
    citizens_registered: int = 0
    grievances_filed: int = 0


class SchemeAnalytics(BaseModel):
    scheme_id: str
    scheme_name: str
    category: str
    total_applications: int = 0
    approved: int = 0
    rejected: int = 0
    pending: int = 0
    approval_rate: float = 0.0
    avg_processing_time_days: float = 0.0
    benefits_disbursed: float = 0.0


class SchemeDeepAnalytics(BaseModel):
    scheme_id: str
    scheme_name: str
    category: str
    description: Optional[str] = None
    total_applications: int = 0
    approved: int = 0
    rejected: int = 0
    pending: int = 0
    draft: int = 0
    approval_rate: float = 0.0
    avg_processing_time_days: float = 0.0
    benefits_disbursed: float = 0.0
    monthly_trend: list[dict] = Field(default_factory=list)
    district_breakdown: list[dict] = Field(default_factory=list)
    rejection_reasons: list[dict] = Field(default_factory=list)


class GeoBreakdown(BaseModel):
    location_type: str
    location_name: str
    total_citizens: int = 0
    total_applications: int = 0
    approved: int = 0
    pending: int = 0
    rejected: int = 0


class GeoHeatmapPoint(BaseModel):
    lat: float
    lng: float
    density: float = 0.0
    label: Optional[str] = None


class AIMetrics(BaseModel):
    intent_accuracy: float = 0.0
    ocr_accuracy: float = 0.0
    translation_accuracy: float = 0.0
    avg_response_time_ms: float = 0.0
    total_conversations: int = 0
    active_users_today: int = 0
    language_distribution: list[dict] = Field(default_factory=list)


class LanguageStats(BaseModel):
    language: str
    language_label: str
    total_conversations: int = 0
    total_users: int = 0
    avg_session_duration_sec: float = 0.0
    intent_accuracy: float = 0.0


class ExportRequest(BaseModel):
    format: str = "csv"
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    sections: list[str] = Field(default_factory=lambda: ["overview"])


class ExportResponse(BaseModel):
    export_id: str
    status: str = "processing"
    format: str
    download_url: Optional[str] = None
    expires_at: Optional[str] = None
    created_at: str


class ExportStatus(BaseModel):
    export_id: str
    status: str = "processing"
    progress: int = 0
    download_url: Optional[str] = None
    expires_at: Optional[str] = None
    error: Optional[str] = None


class AnalyticsError(BaseModel):
    detail: str
    code: str = "analytics_error"
    request_id: Optional[str] = None
