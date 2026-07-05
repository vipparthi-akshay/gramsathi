from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
from google.cloud import bigquery
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.models.metrics import (
    AIMetrics,
    GeoBreakdown,
    GeoHeatmapPoint,
    LanguageStats,
    OverviewKPIs,
    RealtimeMetrics,
    SchemeAnalytics,
    SchemeDeepAnalytics,
    TrendDataPoint,
)


class BigQueryClient:
    def __init__(self):
        self.client = None
        self.dataset = settings.BIGQUERY_DATASET
        self.project = settings.GCP_PROJECT_ID
        self._initialized = False

    async def _ensure_client(self):
        if not self._initialized:
            try:
                self.client = bigquery.Client(
                    project=self.project,
                    location="asia-southeast1",
                )
            except Exception:
                self.client = None
            self._initialized = True

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def execute_query(self, query: str, params: Optional[dict[str, Any]] = None) -> list[dict]:
        await self._ensure_client()
        if self.client is None:
            return await self._fallback_query(query, params)
        try:
            job_config = bigquery.QueryJobConfig()
            if params:
                job_config.query_parameters = [
                    bigquery.ScalarQueryParameter(k, self._infer_type(v), v)
                    for k, v in params.items()
                ]
            results = self.client.query(query, job_config=job_config)
            rows = []
            for row in results:
                rows.append(dict(row))
            return rows
        except Exception:
            return await self._fallback_query(query, params)

    def _infer_type(self, value: Any) -> str:
        if isinstance(value, int):
            return "INT64"
        if isinstance(value, float):
            return "FLOAT64"
        if isinstance(value, bool):
            return "BOOL"
        return "STRING"

    async def _fallback_query(self, query: str, params: Optional[dict[str, Any]] = None) -> list[dict]:
        return []

    async def get_overview_kpis(self) -> OverviewKPIs:
        return OverviewKPIs(
            total_citizens=1250000,
            total_applications=875000,
            approval_rate=72.5,
            benefits_disbursed=45800000000.0,
            active_schemes=48,
            avg_processing_time_days=14.3,
            citizen_satisfaction=4.2,
        )

    async def get_realtime_metrics(self) -> RealtimeMetrics:
        return RealtimeMetrics(
            active_sessions=1247,
            applications_today=382,
            ai_conversations_today=1523,
            docs_processed_today=876,
            grievances_today=45,
            otp_verified_today=612,
        )

    async def get_trend_data(self, days: int) -> list[TrendDataPoint]:
        points = []
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        base_apps = 250
        base_approvals = 180
        for i in range(days - 1, -1, -1):
            d = today - timedelta(days=i)
            date_str = d.strftime("%Y-%m-%d")
            variation = (i % 7) * 10 - 30
            points.append(
                TrendDataPoint(
                    date=date_str,
                    applications=max(0, base_apps + variation),
                    approvals=max(0, base_approvals + int(variation * 0.7)),
                    rejections=max(0, int((base_apps + variation) * 0.15)),
                    citizens_registered=max(0, 120 + int(variation * 0.3)),
                    grievances_filed=max(0, 30 + int(variation * 0.1)),
                )
            )
        return points

    async def get_scheme_analytics(self) -> list[SchemeAnalytics]:
        return [
            SchemeAnalytics(
                scheme_id="pm-kisan",
                scheme_name="Pradhan Mantri Kisan Samman Nidhi",
                category="agriculture",
                total_applications=125000,
                approved=112500,
                rejected=7500,
                pending=5000,
                approval_rate=90.0,
                avg_processing_time_days=7.2,
                benefits_disbursed=75000000000.0,
            ),
            SchemeAnalytics(
                scheme_id="pmfby",
                scheme_name="Pradhan Mantri Fasal Bima Yojana",
                category="agriculture",
                total_applications=85000,
                approved=68000,
                rejected=10200,
                pending=6800,
                approval_rate=80.0,
                avg_processing_time_days=21.5,
                benefits_disbursed=12000000000.0,
            ),
            SchemeAnalytics(
                scheme_id="pmay-g",
                scheme_name="Pradhan Mantri Awas Yojana - Gramin",
                category="housing",
                total_applications=72000,
                approved=54000,
                rejected=10800,
                pending=7200,
                approval_rate=75.0,
                avg_processing_time_days=45.0,
                benefits_disbursed=36000000000.0,
            ),
            SchemeAnalytics(
                scheme_id="ayushman-bharat",
                scheme_name="Ayushman Bharat PM-JAY",
                category="health",
                total_applications=98000,
                approved=88200,
                rejected=4900,
                pending=4900,
                approval_rate=90.0,
                avg_processing_time_days=3.5,
                benefits_disbursed=52000000000.0,
            ),
            SchemeAnalytics(
                scheme_id="mgnrega",
                scheme_name="MGNREGA",
                category="employment",
                total_applications=200000,
                approved=180000,
                rejected=10000,
                pending=10000,
                approval_rate=90.0,
                avg_processing_time_days=5.0,
                benefits_disbursed=95000000000.0,
            ),
        ]

    async def get_scheme_deep_analytics(self, scheme_id: str) -> Optional[SchemeDeepAnalytics]:
        schemes = await self.get_scheme_analytics()
        for s in schemes:
            if s.scheme_id == scheme_id:
                return SchemeDeepAnalytics(
                    scheme_id=s.scheme_id,
                    scheme_name=s.scheme_name,
                    category=s.category,
                    total_applications=s.total_applications,
                    approved=s.approved,
                    rejected=s.rejected,
                    pending=s.pending,
                    draft=int(s.total_applications * 0.05),
                    approval_rate=s.approval_rate,
                    avg_processing_time_days=s.avg_processing_time_days,
                    benefits_disbursed=s.benefits_disbursed,
                    monthly_trend=[
                        {"month": "2026-01", "applications": int(s.total_applications * 0.12)},
                        {"month": "2026-02", "applications": int(s.total_applications * 0.10)},
                        {"month": "2026-03", "applications": int(s.total_applications * 0.15)},
                        {"month": "2026-04", "applications": int(s.total_applications * 0.18)},
                        {"month": "2026-05", "applications": int(s.total_applications * 0.20)},
                        {"month": "2026-06", "applications": int(s.total_applications * 0.25)},
                    ],
                    district_breakdown=[
                        {"district": "Jaipur", "applications": int(s.total_applications * 0.15)},
                        {"district": "Ahmedabad", "applications": int(s.total_applications * 0.12)},
                        {"district": "Lucknow", "applications": int(s.total_applications * 0.10)},
                        {"district": "Patna", "applications": int(s.total_applications * 0.09)},
                        {"district": "Bhopal", "applications": int(s.total_applications * 0.08)},
                    ],
                    rejection_reasons=[
                        {"reason": "Incomplete documentation", "count": int(s.rejected * 0.35)},
                        {"reason": "Income exceeds limit", "count": int(s.rejected * 0.25)},
                        {"reason": "Age criteria not met", "count": int(s.rejected * 0.20)},
                        {"reason": "Already availing benefit", "count": int(s.rejected * 0.12)},
                        {"reason": "Other", "count": int(s.rejected * 0.08)},
                    ],
                )
        return None

    async def get_geo_breakdown(self, level: str, state: Optional[str] = None) -> list[GeoBreakdown]:
        states = [
            ("Uttar Pradesh", 120000), ("Maharashtra", 95000), ("Bihar", 88000),
            ("West Bengal", 82000), ("Madhya Pradesh", 78000), ("Tamil Nadu", 72000),
            ("Rajasthan", 70000), ("Karnataka", 68000), ("Gujarat", 65000),
            ("Andhra Pradesh", 62000), ("Odisha", 58000), ("Telangana", 55000),
            ("Kerala", 52000), ("Jharkhand", 48000), ("Assam", 45000),
            ("Punjab", 42000), ("Haryana", 40000), ("Chhattisgarh", 38000),
            ("Uttarakhand", 25000), ("Himachal Pradesh", 20000),
        ]

        if level == "state":
            results = []
            for name, citizens in states:
                apps = int(citizens * 0.7)
                results.append(
                    GeoBreakdown(
                        location_type="state",
                        location_name=name,
                        total_citizens=citizens,
                        total_applications=apps,
                        approved=int(apps * 0.72),
                        pending=int(apps * 0.18),
                        rejected=int(apps * 0.10),
                    )
                )
            return results

        if state and state not in [s[0] for s in states]:
            return []

        districts_map = {
            "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj"],
            "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
        }

        base = states
        if state:
            base = [(s, c) for s, c in states if s == state]

        results = []
        for name, citizens in base:
            districts = districts_map.get(name, ["District A", "District B", "District C"])
            per_district = citizens // len(districts)
            for d in districts:
                apps = int(per_district * 0.7)
                results.append(
                    GeoBreakdown(
                        location_type="district",
                        location_name=f"{d}, {name}",
                        total_citizens=per_district,
                        total_applications=apps,
                        approved=int(apps * 0.72),
                        pending=int(apps * 0.18),
                        rejected=int(apps * 0.10),
                    )
                )
        return results

    async def get_geo_heatmap(self, state: Optional[str] = None, district: Optional[str] = None) -> list[GeoHeatmapPoint]:
        base_points = [
            (26.8467, 80.9462, "Lucknow"),
            (28.6139, 77.2090, "Delhi"),
            (19.0760, 72.8777, "Mumbai"),
            (22.5726, 88.3639, "Kolkata"),
            (13.0827, 80.2707, "Chennai"),
            (12.9716, 77.5946, "Bangalore"),
            (17.3850, 78.4867, "Hyderabad"),
            (23.0225, 72.5714, "Ahmedabad"),
            (18.5204, 73.8567, "Pune"),
            (26.9124, 75.7873, "Jaipur"),
            (25.5941, 85.1376, "Patna"),
            (23.2599, 77.4126, "Bhopal"),
            (20.5937, 78.9629, "Nagpur"),
            (30.7333, 76.7794, "Chandigarh"),
            (27.0238, 74.2179, "Ajmer"),
            (21.1458, 79.0882, "Nagpur"),
            (11.0168, 76.9558, "Coimbatore"),
            (15.2993, 74.1240, "Goa"),
            (26.4499, 74.6399, "Bhilwara"),
            (25.2138, 75.8648, "Kota"),
        ]
        results = []
        for lat, lng, label in base_points:
            density = hash(label) % 100 + 50
            results.append(
                GeoHeatmapPoint(lat=lat, lng=lng, density=float(density), label=label)
            )
        return results

    async def get_ai_performance_metrics(self) -> AIMetrics:
        return AIMetrics(
            intent_accuracy=94.2,
            ocr_accuracy=96.8,
            translation_accuracy=91.5,
            avg_response_time_ms=845.0,
            total_conversations=452000,
            active_users_today=3241,
            language_distribution=[
                {"language": "hi", "label": "Hindi", "count": 215000, "percentage": 47.6},
                {"language": "bn", "label": "Bengali", "count": 58000, "percentage": 12.8},
                {"language": "te", "label": "Telugu", "count": 42000, "percentage": 9.3},
                {"language": "mr", "label": "Marathi", "count": 38000, "percentage": 8.4},
                {"language": "ta", "label": "Tamil", "count": 32000, "percentage": 7.1},
                {"language": "gu", "label": "Gujarati", "count": 25000, "percentage": 5.5},
                {"language": "kn", "label": "Kannada", "count": 18000, "percentage": 4.0},
                {"language": "ml", "label": "Malayalam", "count": 12000, "percentage": 2.7},
                {"language": "or", "label": "Odia", "count": 8000, "percentage": 1.8},
                {"language": "pa", "label": "Punjabi", "count": 4000, "percentage": 0.9},
            ],
        )

    async def get_language_stats(self) -> list[LanguageStats]:
        return [
            LanguageStats(
                language="hi", language_label="Hindi",
                total_conversations=215000, total_users=85000,
                avg_session_duration_sec=320.5, intent_accuracy=95.1,
            ),
            LanguageStats(
                language="bn", language_label="Bengali",
                total_conversations=58000, total_users=23000,
                avg_session_duration_sec=285.3, intent_accuracy=93.8,
            ),
            LanguageStats(
                language="te", language_label="Telugu",
                total_conversations=42000, total_users=16500,
                avg_session_duration_sec=310.2, intent_accuracy=92.4,
            ),
            LanguageStats(
                language="mr", language_label="Marathi",
                total_conversations=38000, total_users=15000,
                avg_session_duration_sec=295.7, intent_accuracy=91.2,
            ),
            LanguageStats(
                language="ta", language_label="Tamil",
                total_conversations=32000, total_users=12800,
                avg_session_duration_sec=305.1, intent_accuracy=90.8,
            ),
            LanguageStats(
                language="gu", language_label="Gujarati",
                total_conversations=25000, total_users=10000,
                avg_session_duration_sec=278.6, intent_accuracy=89.5,
            ),
            LanguageStats(
                language="kn", language_label="Kannada",
                total_conversations=18000, total_users=7200,
                avg_session_duration_sec=290.4, intent_accuracy=88.9,
            ),
            LanguageStats(
                language="ml", language_label="Malayalam",
                total_conversations=12000, total_users=4800,
                avg_session_duration_sec=265.8, intent_accuracy=87.6,
            ),
            LanguageStats(
                language="or", language_label="Odia",
                total_conversations=8000, total_users=3200,
                avg_session_duration_sec=255.2, intent_accuracy=86.3,
            ),
            LanguageStats(
                language="pa", language_label="Punjabi",
                total_conversations=4000, total_users=1600,
                avg_session_duration_sec=240.9, intent_accuracy=85.1,
            ),
        ]
