import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select

from scheme_service.app.models.application import Application
from scheme_service.app.models.scheme import Scheme
from scheme_service.app.schemas.application import (
    ApplicationApprove,
    ApplicationCreate,
    ApplicationReject,
    ApplicationUpdate,
    BulkApproveRequest,
)
from scheme_service.app.schemas.scheme import SchemeCreate, SchemeUpdate
from scheme_service.app.utils.eligibility_engine import (
    CitizenProfile,
    EligibilityEngine,
)


@pytest.fixture
def eligibility_engine():
    return EligibilityEngine()


@pytest.fixture
def sample_citizen():
    return CitizenProfile(
        id=uuid.uuid4(),
        date_of_birth=date(1990, 6, 15),
        gender="male",
        state="Uttar Pradesh",
        district="Lucknow",
        caste_category="obc",
        annual_income=450000,
        occupation="farmer",
        is_farmer=True,
        has_disability=False,
        education_level="secondary",
        land_holding=2.5,
        is_bpl=False,
    )


@pytest.fixture
def sample_scheme(db_session):
    scheme = Scheme(
        name="PM Kisan Samman Nidhi",
        name_hindi="प्रधानमंत्री किसान सम्मान निधि",
        description="Income support for farmers",
        category="agriculture",
        ministry="Ministry of Agriculture",
        eligibility_criteria={
            "age": {"min": 18, "max": 120},
            "income": {"ceiling": 500000},
            "occupation": ["farmer"],
            "state": {"states": ["Uttar Pradesh", "Maharashtra"]},
        },
        benefits={"amount": 6000, "frequency": "yearly"},
        required_documents=[{"name": "Aadhaar", "type": "aadhaar"}],
        is_active=True,
        tags=["kisan", "farmer"],
    )
    db_session.add(scheme)
    db_session.commit()
    return scheme


class TestSchemeCreation:
    @pytest.mark.asyncio
    async def test_create_scheme(self, db_session):
        scheme = Scheme(
            name="Test Scheme",
            category="education",
            eligibility_criteria={"age": {"min": 5, "max": 18}},
            benefits={"amount": 10000},
            required_documents=[],
            is_active=True,
            tags=["test"],
        )
        db_session.add(scheme)
        await db_session.commit()

        result = await db_session.execute(
            select(Scheme).where(Scheme.name == "Test Scheme")
        )
        saved = result.scalar_one_or_none()
        assert saved is not None
        assert saved.category == "education"
        assert saved.eligibility_criteria["age"]["min"] == 5

    @pytest.mark.asyncio
    async def test_create_scheme_missing_fields(self):
        with pytest.raises(Exception):
            Scheme(
                name="",
                category="",
                eligibility_criteria={},
                benefits={},
                required_documents=[],
            )


class TestEligibilityEngine:
    def test_eligibility_engine_passes(self, eligibility_engine, sample_citizen, sample_scheme):
        result = eligibility_engine.check_eligibility(sample_citizen, sample_scheme)
        assert result.eligible is True
        assert result.score >= 0.5

    def test_eligibility_engine_fails_income(self, eligibility_engine, sample_citizen, sample_scheme):
        sample_citizen.annual_income = 600000
        result = eligibility_engine.check_eligibility(sample_citizen, sample_scheme)
        assert result.eligible is False
        assert any("income" in r.lower() or "ceiling" in r.lower() for r in result.missing_requirements)

    def test_eligibility_engine_fails_age(self, eligibility_engine, sample_citizen, sample_scheme):
        sample_citizen._age = 17
        result = eligibility_engine.check_eligibility(sample_citizen, sample_scheme)
        assert result.eligible is False
        assert any("age" in r.lower() for r in result.missing_requirements)

    def test_eligibility_engine_fails_state(self, eligibility_engine, sample_citizen, sample_scheme):
        sample_citizen.state = "Kerala"
        result = eligibility_engine.check_eligibility(sample_citizen, sample_scheme)
        assert result.eligible is False
        assert any("state" in r.lower() for r in result.missing_requirements)

    def test_eligibility_batch_check(self, eligibility_engine, sample_citizen, sample_scheme):
        scheme2 = Scheme(
            name="Scheme 2",
            category="health",
            eligibility_criteria={"age": {"min": 60, "max": 120}},
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )
        results = eligibility_engine.batch_check(sample_citizen, [sample_scheme, scheme2])
        assert len(results) == 2
        assert results[0].eligible is True
        assert results[1].eligible is False

    def test_complex_criteria_combined(self, eligibility_engine):
        citizen = CitizenProfile(
            id=uuid.uuid4(),
            date_of_birth=date(1985, 1, 1),
            gender="female",
            state="Maharashtra",
            caste_category="sc",
            annual_income=120000,
            occupation="teacher",
            is_farmer=False,
            has_disability=True,
            disability_type="visual",
            education_level="graduate",
            is_bpl=True,
        )
        scheme = Scheme(
            name="Complex Scheme",
            category="social",
            eligibility_criteria={
                "age": {"min": 18, "max": 60},
                "income": {"ceiling": 200000},
                "gender": ["female"],
                "caste": {"categories": ["sc", "st"]},
                "disability": {"required": True, "types": ["visual", "hearing"]},
                "bpl": {"required": True},
            },
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )
        result = eligibility_engine.check_eligibility(citizen, scheme)
        assert result.eligible is True

    def test_disability_eligibility(self, eligibility_engine):
        citizen = CitizenProfile(
            id=uuid.uuid4(),
            date_of_birth=date(1990, 1, 1),
            has_disability=True,
            disability_type="visual",
        )
        scheme = Scheme(
            name="PWD Scheme",
            category="social",
            eligibility_criteria={"disability": {"required": True, "types": ["visual"]}},
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )
        result = eligibility_engine.check_eligibility(citizen, scheme)
        assert result.eligible is True

    def test_caste_eligibility_specific(self, eligibility_engine):
        citizen = CitizenProfile(
            id=uuid.uuid4(),
            date_of_birth=date(1990, 1, 1),
            caste_category="general",
        )
        scheme = Scheme(
            name="SC/ST Scheme",
            category="social",
            eligibility_criteria={"caste": {"categories": ["sc", "st"]}},
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )
        result = eligibility_engine.check_eligibility(citizen, scheme)
        assert result.eligible is False

        scheme2 = Scheme(
            name="Open Scheme",
            category="social",
            eligibility_criteria={"caste": {"categories": ["sc", "st", "obc", "general"], "open_to_all": True}},
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )
        result2 = eligibility_engine.check_eligibility(citizen, scheme2)
        assert result2.eligible is True


class TestApplicationWorkflow:
    @pytest.mark.asyncio
    async def test_application_draft_submit_approve(self, db_session, sample_scheme):
        citizen_id = uuid.uuid4()

        app = Application(
            citizen_id=citizen_id,
            scheme_id=sample_scheme.id,
            form_data={"name": "Test User", "age": 30},
            documents_submitted=[],
            status="draft",
        )
        db_session.add(app)
        await db_session.commit()
        assert app.status == "draft"

        app.status = "submitted"
        app.submitted_at = datetime.now(timezone.utc)
        await db_session.commit()

        result = await db_session.execute(
            select(Application).where(Application.id == app.id)
        )
        updated = result.scalar_one_or_none()
        assert updated.status == "submitted"
        assert updated.submitted_at is not None

        updated.status = "under_review"
        updated.reviewed_at = datetime.now(timezone.utc)
        await db_session.commit()

        updated.status = "approved"
        updated.government_ref_id = "GOV-REF-001"
        await db_session.commit()

        result = await db_session.execute(
            select(Application).where(Application.id == app.id)
        )
        final = result.scalar_one_or_none()
        assert final.status == "approved"
        assert final.government_ref_id == "GOV-REF-001"

    @pytest.mark.asyncio
    async def test_application_rejection_with_reason(self, db_session, sample_scheme):
        app = Application(
            citizen_id=uuid.uuid4(),
            scheme_id=sample_scheme.id,
            form_data={},
            documents_submitted=[],
            status="under_review",
        )
        db_session.add(app)
        await db_session.commit()

        app.status = "rejected"
        app.rejection_reason = "Income exceeds eligibility ceiling"
        app.reviewed_at = datetime.now(timezone.utc)
        await db_session.commit()

        result = await db_session.execute(
            select(Application).where(Application.id == app.id)
        )
        rejected = result.scalar_one_or_none()
        assert rejected.status == "rejected"
        assert "Income" in rejected.rejection_reason

    @pytest.mark.asyncio
    async def test_bulk_approve(self, db_session, sample_scheme):
        apps = []
        for i in range(3):
            app = Application(
                citizen_id=uuid.uuid4(),
                scheme_id=sample_scheme.id,
                form_data={},
                documents_submitted=[],
                status="under_review",
            )
            db_session.add(app)
            apps.append(app)
        await db_session.commit()

        app_ids = [a.id for a in apps]
        for a in apps:
            a.status = "approved"
            a.government_ref_id = "BULK-001"
        await db_session.commit()

        result = await db_session.execute(
            select(Application).where(
                Application.id.in_(app_ids),
                Application.status == "approved",
            )
        )
        approved = result.scalars().all()
        assert len(approved) == 3

    @pytest.mark.asyncio
    async def test_application_status_transitions(self, db_session, sample_scheme):
        app = Application(
            citizen_id=uuid.uuid4(),
            scheme_id=sample_scheme.id,
            form_data={},
            documents_submitted=[],
            status="draft",
        )
        db_session.add(app)
        await db_session.commit()

        valid_transitions = {
            "draft": ["submitted"],
            "submitted": ["under_review", "rejected"],
            "under_review": ["approved", "rejected"],
            "approved": [],
            "rejected": [],
        }

        app.status = "submitted"
        await db_session.commit()
        assert app.status == "submitted"

        app.status = "under_review"
        await db_session.commit()
        assert app.status == "under_review"

        app.status = "approved"
        await db_session.commit()
        assert app.status == "approved"


class TestSchemeSearch:
    @pytest.mark.asyncio
    async def test_scheme_search_by_category(self, db_session):
        schemes_data = [
            Scheme(name="Agri Scheme", category="agriculture", benefits={}, required_documents=[], is_active=True, tags=[], eligibility_criteria={}),
            Scheme(name="Health Scheme", category="health", benefits={}, required_documents=[], is_active=True, tags=[], eligibility_criteria={}),
            Scheme(name="Education Scheme", category="education", benefits={}, required_documents=[], is_active=True, tags=[], eligibility_criteria={}),
        ]
        for s in schemes_data:
            db_session.add(s)
        await db_session.commit()

        result = await db_session.execute(
            select(Scheme).where(
                Scheme.is_active == True,
                Scheme.is_deleted == False,
                Scheme.category == "agriculture",
            )
        )
        schemes = result.scalars().all()
        assert len(schemes) == 1
        assert schemes[0].category == "agriculture"

    @pytest.mark.asyncio
    async def test_scheme_search_by_state(self, db_session):
        scheme = Scheme(
            name="Maharashtra Scheme",
            category="agriculture",
            state_specific="Maharashtra",
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
            eligibility_criteria={},
        )
        db_session.add(scheme)
        await db_session.commit()

        result = await db_session.execute(
            select(Scheme).where(
                Scheme.is_active == True,
                Scheme.is_deleted == False,
                (Scheme.state_specific == "Maharashtra") | (Scheme.state_specific.is_(None)),
            )
        )
        schemes = result.scalars().all()
        assert len(schemes) >= 1

    @pytest.mark.asyncio
    async def test_scheme_search_by_ministry(self, db_session):
        scheme = Scheme(
            name="Defence Scheme",
            category="defence",
            ministry="Ministry of Defence",
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
            eligibility_criteria={},
        )
        db_session.add(scheme)
        await db_session.commit()

        result = await db_session.execute(
            select(Scheme).where(
                Scheme.is_active == True,
                Scheme.is_deleted == False,
                Scheme.ministry == "Ministry of Defence",
            )
        )
        schemes = result.scalars().all()
        assert len(schemes) == 1
