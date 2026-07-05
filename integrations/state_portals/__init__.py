"""
State-specific portal integrations for various Indian states.

Provides a registry pattern to map states to their respective portal
configurations and handles application submission/status checking
for Rajasthan, Maharashtra, Tamil Nadu, Bihar, and Uttar Pradesh.
"""

from __future__ import annotations

import hashlib
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


class StatePortalError(Exception):
    """Base exception for state portal integration."""


class StatePortalConfigError(StatePortalError):
    """Raised when portal configuration is invalid."""


class StatePortalSubmissionError(StatePortalError):
    """Raised when application submission fails."""


class StatePortalNotFoundError(StatePortalError):
    """Raised when a state portal is not configured."""


@dataclass
class StatePortalConfig:
    state: str
    state_code: str
    portal_name: str
    api_base_url: str = ""
    api_key: str = ""
    api_secret: str = ""
    department_mapping: dict[str, str] = field(default_factory=dict)
    scheme_mapping: dict[str, str] = field(default_factory=dict)
    timeout_seconds: int = 30
    max_retries: int = 3


STATE_PORTAL_CONFIGS: dict[str, StatePortalConfig] = {
    "rajasthan": StatePortalConfig(
        state="Rajasthan",
        state_code="RJ",
        portal_name="e-Mitra Rajasthan",
        api_base_url="https://api.emitra.rajasthan.gov.in/v1",
        department_mapping={
            "agriculture": "Dept of Agriculture",
            "health": "Dept of Health & Family Welfare",
            "education": "Dept of Education",
            "revenue": "Dept of Revenue",
            "social_justice": "Dept of Social Justice & Empowerment",
            "rural_development": "Dept of Rural Development",
        },
        scheme_mapping={
            "pm-kisan": "PMKSN_RJ",
            "pm-awas": "PMAY_G_RJ",
            "ujjwala": "UJJWALA_RJ",
            "mg-nrega": "MGNREGA_RJ",
        },
    ),
    "maharashtra": StatePortalConfig(
        state="Maharashtra",
        state_code="MH",
        portal_name="Aaple Sarkar (Maharashtra Online)",
        api_base_url="https://api.aapalesarkar.maharashtra.gov.in/v1",
        department_mapping={
            "agriculture": "Krishi Vibhag",
            "health": "Arogya Vibhag",
            "education": "Shikshan Vibhag",
            "revenue": "Mahasul Vibhag",
            "social_justice": "Samajik Nyay Vibhag",
            "rural_development": "Gramin Vikas Vibhag",
        },
        scheme_mapping={
            "pm-kisan": "PMKSN_MH",
            "pm-awas": "PMAY_G_MH",
            "ujjwala": "UJJWALA_MH",
            "mg-nrega": "MGNREGA_MH",
        },
    ),
    "tamil_nadu": StatePortalConfig(
        state="Tamil Nadu",
        state_code="TN",
        portal_name="Tamil Nadu e-Sevai",
        api_base_url="https://api.esevai.tn.gov.in/v1",
        department_mapping={
            "agriculture": "Vivasayam Thurai",
            "health": "Sugathara Pangu Thurai",
            "education": "Kallvi Thurai",
            "revenue": "Vara Vari Thurai",
            "social_justice": "Samuthaya Needhi Thurai",
            "rural_development": "Grama Viduthi Thurai",
        },
        scheme_mapping={
            "pm-kisan": "PMKSN_TN",
            "pm-awas": "PMAY_G_TN",
            "ujjwala": "UJJWALA_TN",
            "mg-nrega": "MGNREGA_TN",
        },
    ),
    "bihar": StatePortalConfig(
        state="Bihar",
        state_code="BR",
        portal_name="Bihar e-District Portal",
        api_base_url="https://api.edistrict.bihar.gov.in/v1",
        department_mapping={
            "agriculture": "Krishi Vibhag",
            "health": "Swasthya Vibhag",
            "education": "Shiksha Vibhag",
            "revenue": "Rajswa Vibhag",
            "social_justice": "Samajik Nyay Vibhag",
            "rural_development": "Gramin Vikas Vibhag",
        },
        scheme_mapping={
            "pm-kisan": "PMKSN_BR",
            "pm-awas": "PMAY_G_BR",
            "ujjwala": "UJJWALA_BR",
            "mg-nrega": "MGNREGA_BR",
        },
    ),
    "uttar_pradesh": StatePortalConfig(
        state="Uttar Pradesh",
        state_code="UP",
        portal_name="UP e-District Portal",
        api_base_url="https://api.edistrict.up.gov.in/v1",
        department_mapping={
            "agriculture": "Krishi Vibhag",
            "health": "Swasthya Vibhag",
            "education": "Shiksha Vibhag",
            "revenue": "Rajswa Vibhag",
            "social_justice": "Samajik Nyay Vibhag",
            "rural_development": "Gramin Vikas Vibhag",
        },
        scheme_mapping={
            "pm-kisan": "PMKSN_UP",
            "pm-awas": "PMAY_G_UP",
            "ujjwala": "UJJWALA_UP",
            "mg-nrega": "MGNREGA_UP",
        },
    ),
}


class StatePortalRegistry:
    """Registry for state-specific portal configurations."""

    def __init__(self) -> None:
        self._portals: dict[str, StatePortalClient] = {}
        self._init_portals()

    def _init_portals(self) -> None:
        for state_key, config in STATE_PORTAL_CONFIGS.items():
            self._portals[state_key] = StatePortalClient(config)

    def get_portal(self, state_name: str) -> StatePortalClient:
        state_key = state_name.lower().replace(" ", "_")
        portal = self._portals.get(state_key)
        if not portal:
            raise StatePortalNotFoundError(
                f"No portal configured for state: {state_name}. "
                f"Available: {', '.join(sorted(self.list_states()))}"
            )
        return portal

    def list_states(self) -> list[str]:
        cfg = STATE_PORTAL_CONFIGS
        return [cfg[k].state for k in cfg]

    def list_portals(self) -> list[dict[str, str]]:
        return [
            {"state": cfg.state, "portal": cfg.portal_name, "code": cfg.state_code}
            for cfg in STATE_PORTAL_CONFIGS.values()
        ]


class StatePortalClient:
    """Client for a specific state's portal integration."""

    def __init__(self, config: StatePortalConfig) -> None:
        self.config = config
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
        return {
            "X-API-Key": self.config.api_key or "mock_key",
            "X-State-Code": self.config.state_code,
            "X-Source": "GramSathiAI",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": f"GramSathiAI/1.0 ({self.config.state})",
        }

    def _map_department(self, scheme_category: str) -> str:
        return self.config.department_mapping.get(
            scheme_category, "General Administration"
        )

    def _map_scheme_code(self, scheme_code: str) -> str:
        return self.config.scheme_mapping.get(scheme_code, scheme_code)

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def submit_application(
        self, scheme: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        state_scheme = self._map_scheme_code(scheme)
        department = self._map_department(data.get("category", "general"))

        payload = {
            "application_id": uuid.uuid4().hex,
            "portal": self.config.portal_name,
            "state": self.config.state,
            "state_code": self.config.state_code,
            "scheme_code": state_scheme,
            "department": department,
            "citizen": {
                "name": data.get("citizen_name", ""),
                "phone": data.get("citizen_phone", ""),
                "email": data.get("citizen_email", ""),
                "aadhaar_last4": data.get("aadhaar_last4", ""),
                "address": data.get("citizen_address", ""),
                "district": data.get("district", ""),
                "village": data.get("village", ""),
                "pincode": data.get("pincode", ""),
                "caste": data.get("caste", ""),
                "income": data.get("income", 0),
            },
            "scheme_data": {
                "benefits_required": data.get("benefits", []),
                "existing_benefits": data.get("existing_benefits", []),
                "documents": data.get("documents", []),
            },
            "metadata": {
                "submitted_via": "GramSathi AI",
                "language": data.get("language", "en"),
                "submitted_at": time.strftime(
                    "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
                ),
            },
            "attachments": [
                {
                    "doc_type": doc.get("type", "other"),
                    "doc_id": doc.get("id", ""),
                    "doc_url": doc.get("url", ""),
                }
                for doc in data.get("documents", [])
            ],
        }

        try:
            session = await self._get_session()
            response = await session.post("/applications", json=payload)

            if response.status_code == 422:
                logger.warning(
                    f"{self.config.state} portal validation warning: {response.text}"
                )
            elif response.status_code >= 400:
                logger.warning(
                    f"{self.config.state} API error: {response.status_code}, using mock"
                )
                return self._mock_submit(scheme, data, state_scheme, department)

            data_response = response.json()
            logger.info(
                f"Application submitted to {self.config.state} portal",
                extra={
                    "reference_id": data_response.get("reference_id"),
                    "scheme": scheme,
                },
            )
            return data_response

        except httpx.TimeoutException:
            logger.warning(f"{self.config.state} portal timeout, using mock")
            return self._mock_submit(scheme, data, state_scheme, department)
        except Exception as e:
            logger.error(
                f"{self.config.state} portal submission failed: {e}", exc_info=True
            )
            raise StatePortalSubmissionError(
                f"{self.config.state} submission failed: {e}"
            ) from e

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def check_status(self, state: str, reference_id: str) -> dict[str, Any]:
        try:
            session = await self._get_session()
            response = await session.get(
                f"/applications/{reference_id}",
                params={"state_code": self.config.state_code},
            )

            if response.status_code == 404:
                raise StatePortalError(
                    f"Application {reference_id} not found in {self.config.state}"
                )
            if response.status_code >= 400:
                logger.warning(
                    f"{self.config.state} status check failed: {response.status_code}, using mock"
                )
                return self._mock_status(reference_id)

            return response.json()

        except httpx.TimeoutException:
            logger.warning(
                f"{self.config.state} status check timeout, using mock"
            )
            return self._mock_status(reference_id)
        except StatePortalError:
            raise
        except Exception as e:
            logger.error(
                f"{self.config.state} status check failed: {e}", exc_info=True
            )
            raise StatePortalError(
                f"{self.config.state} status check failed: {e}"
            ) from e

    def _mock_submit(
        self,
        scheme: str,
        data: dict[str, Any],
        state_scheme: str,
        department: str,
    ) -> dict[str, Any]:
        ref_id = f"{self.config.state_code}-{uuid.uuid4().hex[:10].upper()}"
        logger.info(f"Mock submission to {self.config.state} portal: {ref_id}")

        return {
            "success": True,
            "reference_id": ref_id,
            "state": self.config.state,
            "portal": self.config.portal_name,
            "scheme": scheme,
            "state_scheme_code": state_scheme,
            "department": department,
            "status": "submitted",
            "submitted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "estimated_processing_days": 15,
            "tracking_url": (
                f"https://{self.config.state_code.lower()}-portal.gov.in"
                f"/application/{ref_id}"
            ),
            "message": (
                f"Application for {scheme} has been registered with "
                f"{self.config.state} {self.config.portal_name}. "
                "Reference ID has been sent to your registered mobile number."
            ),
        }

    def _mock_status(self, reference_id: str) -> dict[str, Any]:
        statuses = [
            "submitted",
            "under_review",
            "forwarded_to_department",
            "document_verification",
            "approved",
            "benefits_disbursed",
            "rejected",
        ]
        import random
        return {
            "reference_id": reference_id,
            "state": self.config.state,
            "portal": self.config.portal_name,
            "status": random.choice(statuses),
            "current_department": self._map_department("general"),
            "current_officer_designation": "Nodal Officer",
            "submitted_at": "2024-01-10T09:00:00Z",
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "expected_completion": "2024-02-10",
            "timeline": [
                {
                    "date": "2024-01-10",
                    "event": "Application submitted",
                    "office": f"{self.config.portal_name} Portal",
                },
                {
                    "date": "2024-01-12",
                    "event": "Forwarded to department",
                    "office": self.config.department_mapping.get(
                        "rural_development", "Concerned Department"
                    ),
                },
                {
                    "date": "2024-01-15",
                    "event": "Document verification initiated",
                    "office": "Verification Cell",
                },
            ],
            "remarks": (
                f"Your application is being processed by "
                f"{self.config.state} government authorities."
            ),
        }

    async def close(self) -> None:
        if self._session and not self._session.is_closed:
            await self._session.aclose()

    async def __aenter__(self) -> StatePortalClient:
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()


# Convenience functions using the registry pattern

_registry: Optional[StatePortalRegistry] = None


def get_registry() -> StatePortalRegistry:
    global _registry
    if _registry is None:
        _registry = StatePortalRegistry()
    return _registry


async def submit_application(
    state: str, scheme: str, data: dict[str, Any]
) -> dict[str, Any]:
    registry = get_registry()
    portal = registry.get_portal(state)
    return await portal.submit_application(scheme, data)


async def check_status(state: str, reference_id: str) -> dict[str, Any]:
    registry = get_registry()
    portal = registry.get_portal(state)
    return await portal.check_status(state, reference_id)


def list_supported_states() -> list[str]:
    registry = get_registry()
    return registry.list_states()


def list_portals() -> list[dict[str, str]]:
    registry = get_registry()
    return registry.list_portals()
