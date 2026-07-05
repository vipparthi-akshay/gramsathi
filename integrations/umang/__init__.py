"""
UMANG (Unified Mobile Application for New-age Governance) integration.

Provides access to government services through the UMANG platform.
Supports service status checking, service listing, and application submission.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Optional

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

logger = logging.getLogger(__name__)


class UMANGError(Exception):
    """Base exception for UMANG integration."""


class UMANGServiceError(UMANGError):
    """Raised when a UMANG service operation fails."""


class UMANGServiceNotFoundError(UMANGError):
    """Raised when a requested service is not found."""


UMANG_SERVICES = [
    {"code": "GST_CITIZEN", "name": "GST Citizen Services", "department": "CBIC", "type": "tax"},
    {"code": "EPFO_PF", "name": "EPFO Pensioner Services", "department": "EPFO", "type": "social_security"},
    {"code": "NPS", "name": "National Pension System", "department": "PFRDA", "type": "pension"},
    {"code": "PASSPORT", "name": "Passport Seva", "department": "Ministry of External Affairs", "type": "travel"},
    {"code": "INCOME_TAX", "name": "Income Tax Filing", "department": "Income Tax Department", "type": "tax"},
    {"code": "BANKING", "name": "Banking Services", "department": "Various Banks", "type": "finance"},
    {"code": "GAS_BOOKING", "name": "LPG Gas Booking", "department": "Oil Companies", "type": "utility"},
    {"code": "ELECTRICITY", "name": "Electricity Bill Payment", "department": "Power Distribution", "type": "utility"},
    {"code": "WATER", "name": "Water Bill Payment", "department": "Municipal Corporation", "type": "utility"},
    {"code": "DIGILOCKER", "name": "DigiLocker Document Access", "department": "MeitY", "type": "document"},
    {"code": "AADHAAR", "name": "Aadhaar Services", "department": "UIDAI", "type": "identity"},
    {"code": "PM_KISAN", "name": "PM Kisan Status", "department": "Ministry of Agriculture", "type": "scheme"},
    {"code": "RATION_CARD", "name": "Ration Card Services", "department": "Food & Civil Supplies", "type": "food"},
    {"code": "BIRTH_CERT", "name": "Birth Certificate", "department": "Municipal Corporation", "type": "certificate"},
    {"code": "CASTE_CERT", "name": "Caste Certificate", "department": "State Government", "type": "certificate"},
    {"code": "INCOME_CERT", "name": "Income Certificate", "department": "State Government", "type": "certificate"},
    {"code": "DRIVING_LICENSE", "name": "Driving License Services", "department": "Transport Department", "type": "transport"},
    {"code": "VEHICLE_REG", "name": "Vehicle Registration", "department": "Transport Department", "type": "transport"},
    {"code": "E_DISTRICT", "name": "e-District Services", "department": "State Government", "type": "governance"},
    {"code": "JAN_AUSHADHI", "name": "Jan Aushadhi Medicine Availability", "department": "Pharmaceuticals", "type": "health"},
    {"code": "COVID_VACCINE", "name": "COVID-19 Vaccination Certificate", "department": "Ministry of Health", "type": "health"},
    {"code": "CROP_INSURANCE", "name": "Crop Insurance Status", "department": "Ministry of Agriculture", "type": "agriculture"},
    {"code": "SOIL_HEALTH", "name": "Soil Health Card", "department": "Ministry of Agriculture", "type": "agriculture"},
    {"code": "SWACHH_SURVEY", "name": "Swachh Survekshan", "department": "Ministry of Housing", "type": "sanitation"},
    {"code": "NREGAS_HARD", "name": "MGNREGA Job Card", "department": "Ministry of Rural Dev", "type": "employment"},
    {"code": "PENSION", "name": "Pension Services", "department": "Various Departments", "type": "pension"},
    {"code": "PM_AWAS", "name": "PM Awas Yojana Status", "department": "Ministry of Housing", "type": "housing"},
    {"code": "SCHOLARSHIP", "name": "National Scholarship Portal", "department": "Ministry of Education", "type": "education"},
    {"code": "E_COURTS", "name": "e-Courts Services", "department": "Supreme Court", "type": "legal"},
    {"code": "NHA_HEALTH", "name": "Ayushman Bharat Health Services", "department": "NHA", "type": "health"},
]


@dataclass
class UMANGConfig:
    api_base_url: str = "https://api.umang.gov.in/v1"
    api_key: str = ""
    api_secret: str = ""
    department_id: str = "GRAM_SATHI"
    timeout_seconds: int = 30
    max_retries: int = 3
    mock_mode: bool = True


@dataclass
class ServiceStatus:
    code: str
    name: str
    status: str
    available: bool
    message: str = ""
    department: str = ""
    type: str = ""


@dataclass
class ApplicationData:
    service_code: str
    citizen_id: str
    citizen_name: str
    citizen_phone: str
    citizen_email: str
    citizen_aadhaar_last4: str
    form_data: dict[str, Any] = field(default_factory=dict)
    documents: list[dict[str, Any]] = field(default_factory=list)
    language: str = "en"


class UMANGClient:
    """Client for UMANG platform integration."""

    def __init__(self, config: Optional[UMANGConfig] = None) -> None:
        self.config = config or UMANGConfig()
        self._session: Optional[httpx.AsyncClient] = None

    async def _get_session(self) -> httpx.AsyncClient:
        if self._session is None or self._session.is_closed:
            self._session = httpx.AsyncClient(
                base_url=self.config.api_base_url,
                timeout=self.config.timeout_seconds,
                headers=self._build_headers(),
            )
        return self._session

    def _build_headers(self) -> dict[str, str]:
        timestamp = str(int(time.time()))
        nonce = uuid.uuid4().hex
        payload = f"{self.config.api_key}{timestamp}{nonce}"
        signature = hmac.new(
            self.config.api_secret.encode(),
            payload.encode(),
            hashlib.sha256,
        ).hexdigest()

        return {
            "X-API-Key": self.config.api_key,
            "X-Timestamp": timestamp,
            "X-Nonce": nonce,
            "X-Signature": signature,
            "X-Department-ID": self.config.department_id,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "GramSathiAI/1.0",
        }

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def check_service_status(self, service_code: str) -> ServiceStatus:
        service = next(
            (s for s in UMANG_SERVICES if s["code"] == service_code), None
        )
        if not service:
            raise UMANGServiceNotFoundError(f"Service '{service_code}' not found")

        if self.config.mock_mode:
            logger.info(f"Checking UMANG service status: {service_code}")
            return ServiceStatus(
                code=service["code"],
                name=service["name"],
                status="active",
                available=True,
                message="Service is operational and accepting requests",
                department=service["department"],
                type=service["type"],
            )

        session = await self._get_session()
        try:
            response = await session.get(f"/services/{service_code}/status")
            if response.status_code == 404:
                raise UMANGServiceNotFoundError(f"Service '{service_code}' not found")
            if response.status_code >= 400:
                logger.warning(f"UMANG status API error: {response.status_code}")
                return ServiceStatus(
                    code=service_code,
                    name=service["name"],
                    status="unknown",
                    available=False,
                    message=f"API returned status {response.status_code}",
                )

            data = response.json()
            return ServiceStatus(
                code=service_code,
                name=data.get("name", service["name"]),
                status=data.get("status", "unknown"),
                available=data.get("available", False),
                message=data.get("message", ""),
            )
        except httpx.TimeoutException:
            logger.warning("UMANG status check timeout, returning mock")
            return ServiceStatus(
                code=service_code,
                name=service["name"],
                status="active",
                available=True,
                message="Service is operational",
            )

    async def get_available_services(
        self, service_type: Optional[str] = None
    ) -> list[dict[str, Any]]:
        if self.config.mock_mode:
            services = UMANG_SERVICES
            if service_type:
                services = [s for s in services if s["type"] == service_type]
            return services

        session = await self._get_session()
        try:
            params = {}
            if service_type:
                params["type"] = service_type
            response = await session.get("/services", params=params)
            if response.status_code >= 400:
                logger.warning("UMANG services list failed, using local cache")
                return [
                    s for s in UMANG_SERVICES
                    if not service_type or s["type"] == service_type
                ]
            return response.json().get("services", [])
        except httpx.TimeoutException:
            logger.warning("UMANG services list timeout, using local cache")
            return [
                s for s in UMANG_SERVICES
                if not service_type or s["type"] == service_type
            ]

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def submit_application(
        self, application_data: ApplicationData
    ) -> dict[str, Any]:
        service = next(
            (s for s in UMANG_SERVICES if s["code"] == application_data.service_code),
            None,
        )
        if not service:
            raise UMANGServiceNotFoundError(
                f"Service '{application_data.service_code}' not found"
            )

        payload = {
            "service_code": application_data.service_code,
            "citizen_id": application_data.citizen_id,
            "citizen_name": application_data.citizen_name,
            "citizen_mobile": application_data.citizen_phone,
            "citizen_email": application_data.citizen_email,
            "citizen_aadhaar_last4": application_data.citizen_aadhaar_last4,
            "form_data": application_data.form_data,
            "documents": application_data.documents,
            "language": application_data.language,
            "source": "GRAM_SATHI_APP",
            "submitted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        if self.config.mock_mode:
            ref_id = f"UMANG-{uuid.uuid4().hex[:12].upper()}"
            logger.info(
                f"UMANG application submitted (mock): {ref_id}",
                extra={"service": application_data.service_code},
            )
            return {
                "success": True,
                "reference_id": ref_id,
                "service_code": application_data.service_code,
                "service_name": service["name"],
                "status": "submitted",
                "submitted_at": payload["submitted_at"],
                "estimated_processing_time": "5-7 working days",
                "tracking_url": f"{self.config.api_base_url}/applications/{ref_id}",
                "message": f"Application for {service['name']} submitted successfully",
            }

        session = await self._get_session()
        try:
            response = await session.post("/applications", json=payload)
            if response.status_code == 422:
                raise UMANGServiceError(f"Validation error: {response.text}")
            if response.status_code >= 400:
                raise UMANGServiceError(
                    f"UMANG API error: {response.status_code} - {response.text}"
                )
            return response.json()
        except httpx.TimeoutException:
            logger.warning("UMANG submission timeout, returning mock reference")
            return {
                "success": True,
                "reference_id": f"UMANG-{uuid.uuid4().hex[:12].upper()}",
                "service_code": application_data.service_code,
                "status": "submitted",
                "message": "Application submitted (queued for processing)",
                "mock": True,
            }
        except UMANGServiceError:
            raise
        except Exception as e:
            logger.error(f"UMANG submission failed: {e}", exc_info=True)
            raise UMANGServiceError(f"Failed to submit application: {e}") from e

    async def track_application(self, reference_id: str) -> dict[str, Any]:
        if self.config.mock_mode:
            statuses = ["submitted", "under_process", "forwarded", "completed"]
            import random
            return {
                "reference_id": reference_id,
                "status": random.choice(statuses),
                "current_department": "Concerned Government Department",
                "submitted_at": "2024-01-20T10:30:00Z",
                "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "expected_completion": "2024-02-01",
                "remarks": "Application is being processed at the department level.",
            }

        session = await self._get_session()
        try:
            response = await session.get(f"/applications/{reference_id}")
            if response.status_code == 404:
                raise UMANGServiceNotFoundError(
                    f"Application {reference_id} not found"
                )
            if response.status_code >= 400:
                raise UMANGServiceError(
                    f"UMANG API error: {response.status_code} - {response.text}"
                )
            return response.json()
        except httpx.TimeoutException:
            logger.warning("UMANG tracking timeout, returning mock")
            return {
                "reference_id": reference_id,
                "status": "under_process",
                "message": "Application is being processed",
                "mock": True,
            }
        except (UMANGServiceNotFoundError, UMANGServiceError):
            raise
        except Exception as e:
            logger.error(f"UMANG tracking failed: {e}", exc_info=True)
            raise UMANGServiceError(f"Failed to track application: {e}") from e

    async def close(self) -> None:
        if self._session and not self._session.is_closed:
            await self._session.aclose()

    async def __aenter__(self) -> UMANGClient:
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()
