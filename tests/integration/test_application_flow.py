import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select

from scheme_service.app.models.application import Application
from scheme_service.app.models.scheme import Scheme
from scheme_service.app.utils.eligibility_engine import (
    CitizenProfile,
    EligibilityEngine,
)


@pytest.fixture
def eligibility_engine():
    return EligibilityEngine()


class TestCompleteApplicationFlow:
    @pytest.mark.asyncio
    async def test_citizen_discovers_schemes_and_applies(self, db_session, eligibility_engine):
        scheme = Scheme(
            name="PM Kisan Samman Nidhi",
            category="agriculture",
            ministry="Ministry of Agriculture",
            eligibility_criteria={
                "age": {"min": 18, "max": 120},
                "income": {"ceiling": 500000},
                "occupation": ["farmer"],
            },
            benefits={"amount": 6000, "frequency": "yearly"},
            required_documents=[
                {"name": "Aadhaar Card", "type": "aadhaar"},
                {"name": "Land Records", "type": "land_record"},
            ],
            is_active=True,
            tags=["kisan", "farmer"],
        )
        db_session.add(scheme)
        await db_session.commit()

        eligible_schemes = await db_session.execute(
            select(Scheme).where(
                Scheme.is_active == True,
                Scheme.is_deleted == False,
                Scheme.category == "agriculture",
            )
        )
        schemes = eligible_schemes.scalars().all()
        assert len(schemes) >= 1

        citizen = CitizenProfile(
            id=uuid.uuid4(),
            date_of_birth=date(1990, 6, 15),
            gender="male",
            state="Uttar Pradesh",
            annual_income=350000,
            occupation="farmer",
            is_farmer=True,
            education_level="secondary",
        )

        result = eligibility_engine.check_eligibility(citizen, scheme)
        assert result.eligible is True

        app = Application(
            citizen_id=citizen.id,
            scheme_id=scheme.id,
            form_data={"name": "Ramesh Kumar", "age": 34, "state": "Uttar Pradesh"},
            documents_submitted=[
                {"type": "aadhaar", "file_id": str(uuid.uuid4())},
                {"type": "land_record", "file_id": str(uuid.uuid4())},
            ],
            status="draft",
        )
        db_session.add(app)
        await db_session.commit()

        assert app.status == "draft"

        app.status = "submitted"
        app.submitted_at = datetime.now(timezone.utc)
        await db_session.commit()

        app.status = "under_review"
        app.reviewed_at = datetime.now(timezone.utc)
        app.processed_by = uuid.uuid4()
        app.ai_summary = "Application complete, all documents verified."
        await db_session.commit()

        assert app.status == "under_review"

        app.status = "approved"
        app.government_ref_id = "GOV-REF-2024-001"
        await db_session.commit()

        result = await db_session.execute(
            select(Application).where(Application.id == app.id)
        )
        final = result.scalar_one_or_none()
        assert final.status == "approved"
        assert final.government_ref_id == "GOV-REF-2024-001"

    @pytest.mark.asyncio
    async def test_multi_step_flow_verification(self, db_session, eligibility_engine):
        scheme = Scheme(
            name="Education Scholarship",
            category="education",
            eligibility_criteria={
                "age": {"min": 5, "max": 25},
                "income": {"ceiling": 250000},
                "education": {"min": "primary"},
            },
            benefits={"amount": 12000},
            required_documents=[{"name": "Income Certificate", "type": "income_certificate"}],
            is_active=True,
            tags=["education", "scholarship"],
        )
        db_session.add(scheme)
        await db_session.commit()

        citizen = CitizenProfile(
            id=uuid.uuid4(),
            date_of_birth=date(2010, 1, 1),
            state="Maharashtra",
            annual_income=150000,
            education_level="secondary",
        )
        result = eligibility_engine.check_eligibility(citizen, scheme)
        assert result.eligible is True

        app = Application(
            citizen_id=citizen.id,
            scheme_id=scheme.id,
            form_data={},
            documents_submitted=[],
            status="draft",
        )
        db_session.add(app)
        await db_session.commit()
        assert app.status == "draft"

        app.form_data = {"student_name": "Priya", "class": "10", "school": "Govt School"}
        await db_session.commit()

        app.status = "submitted"
        app.submitted_at = datetime.now(timezone.utc)
        await db_session.commit()
        assert app.status == "submitted"

        app.status = "rejected"
        app.rejection_reason = "Income certificate not provided"
        app.reviewed_at = datetime.now(timezone.utc)
        await db_session.commit()
        assert app.status == "rejected"
        assert app.rejection_reason is not None

    @pytest.mark.asyncio
    async def test_document_ocr_pipeline_end_to_end(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        image_bytes = b"fake_aadhaar_image_bytes"

        ocr_result = client.analyze_document(image_bytes, document_type="aadhaar")
        assert ocr_result is not None
        assert "aadhaar_number" in ocr_result
        assert ocr_result["aadhaar_number"] == "1234-5678-9012"

        profile = {
            "name": ocr_result.get("name", ""),
            "dob": ocr_result.get("dob", ""),
            "aadhaar": ocr_result.get("aadhaar_number", ""),
        }

        schemes = client.rank_schemes_by_relevance(
            profile,
            [{"name": "PM Kisan", "category": "agriculture"}],
        )
        assert len(schemes) > 0

    @pytest.mark.asyncio
    async def test_application_with_invalid_scheme_handling(self, db_session):
        invalid_scheme_id = uuid.uuid4()
        app = Application(
            citizen_id=uuid.uuid4(),
            scheme_id=invalid_scheme_id,
            form_data={},
            documents_submitted=[],
            status="draft",
        )
        db_session.add(app)
        await db_session.commit()

        result = await db_session.execute(
            select(Scheme).where(
                Scheme.id == invalid_scheme_id,
                Scheme.is_deleted == False,
            )
        )
        scheme = result.scalar_one_or_none()
        assert scheme is None

    @pytest.mark.asyncio
    async def test_officer_review_reject_resubmit_flow(self, db_session, eligibility_engine):
        scheme = Scheme(
            name="Housing Scheme",
            category="housing",
            eligibility_criteria={"age": {"min": 18}},
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )
        db_session.add(scheme)
        await db_session.commit()

        citizen = CitizenProfile(id=uuid.uuid4(), date_of_birth=date(1990, 1, 1))

        app = Application(
            citizen_id=citizen.id,
            scheme_id=scheme.id,
            form_data={},
            documents_submitted=[],
            status="draft",
        )
        db_session.add(app)
        await db_session.commit()

        app.status = "submitted"
        app.submitted_at = datetime.now(timezone.utc)
        await db_session.commit()

        officer_id = uuid.uuid4()
        app.status = "under_review"
        app.processed_by = officer_id
        app.reviewed_at = datetime.now(timezone.utc)
        await db_session.commit()

        assert app.status == "under_review"

        app.status = "rejected"
        app.rejection_reason = "Missing address proof"
        await db_session.commit()

        assert app.status == "rejected"

        app.status = "draft"
        app.rejection_reason = None
        app.form_data = {"address": "123 Village Road"}
        app.documents_submitted = [{"type": "address_proof", "file_id": str(uuid.uuid4())}]
        await db_session.commit()

        app.status = "submitted"
        app.submitted_at = datetime.now(timezone.utc)
        await db_session.commit()

        app.status = "approved"
        app.government_ref_id = "HOUSING-001"
        await db_session.commit()

        assert app.status == "approved"
