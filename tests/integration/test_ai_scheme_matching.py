import json
import uuid
from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scheme_service.app.utils.eligibility_engine import (
    CitizenProfile,
    EligibilityEngine,
)


@pytest.fixture
def engine():
    return EligibilityEngine()


def make_profile(**kwargs):
    defaults = {
        "id": uuid.uuid4(),
        "date_of_birth": date(1990, 1, 1),
        "gender": "male",
        "state": "Maharashtra",
        "district": "Pune",
        "caste_category": "general",
        "annual_income": 300000,
        "occupation": "teacher",
        "is_farmer": False,
        "has_disability": False,
        "education_level": "graduate",
        "land_holding": None,
        "is_bpl": False,
    }
    defaults.update(kwargs)
    return CitizenProfile(**defaults)


class TestSchemeMatching:
    def test_profile_matched_against_catalog(self, engine):
        from scheme_service.app.models.scheme import Scheme

        schemes = [
            Scheme(
                name="PM Kisan Samman Nidhi",
                category="agriculture",
                eligibility_criteria={
                    "age": {"min": 18},
                    "income": {"ceiling": 500000},
                    "occupation": ["farmer"],
                },
                benefits={"amount": 6000, "frequency": "yearly"},
                required_documents=[],
                is_active=True,
                tags=[],
            ),
            Scheme(
                name="Education Scholarship",
                category="education",
                eligibility_criteria={
                    "age": {"min": 5, "max": 25},
                    "income": {"ceiling": 250000},
                },
                benefits={"amount": 12000, "frequency": "yearly"},
                required_documents=[],
                is_active=True,
                tags=[],
            ),
            Scheme(
                name="Senior Citizen Pension",
                category="social",
                eligibility_criteria={
                    "age": {"min": 60},
                    "income": {"ceiling": 100000},
                },
                benefits={"amount": 18000, "frequency": "yearly"},
                required_documents=[],
                is_active=True,
                tags=[],
            ),
        ]

        farmer = make_profile(occupation="farmer", is_farmer=True, annual_income=250000, state="Uttar Pradesh")
        results = engine.batch_check(farmer, schemes)

        eligible_schemes = [(r.scheme_name, r.score) for r in results if r.eligible]
        assert len(eligible_schemes) >= 1
        assert any("Kisan" in name for name, _ in eligible_schemes)

    def test_correct_scheme_ranking_based_on_profile(self, engine):
        from scheme_service.app.models.scheme import Scheme

        schemes = [
            Scheme(
                name="Farmer Scheme",
                category="agriculture",
                eligibility_criteria={
                    "age": {"min": 18, "max": 70},
                    "income": {"ceiling": 500000},
                    "occupation": ["farmer"],
                },
                benefits={},
                required_documents=[],
                is_active=True,
                tags=[],
            ),
            Scheme(
                name="General Scheme",
                category="general",
                eligibility_criteria={"age": {"min": 18, "max": 100}},
                benefits={},
                required_documents=[],
                is_active=True,
                tags=[],
            ),
            Scheme(
                name="Teacher Scheme",
                category="education",
                eligibility_criteria={
                    "age": {"min": 22, "max": 60},
                    "occupation": ["teacher"],
                },
                benefits={},
                required_documents=[],
                is_active=True,
                tags=[],
            ),
        ]

        teacher = make_profile(occupation="teacher", is_farmer=False)
        results = engine.batch_check(teacher, schemes)

        scores = {r.scheme_name: r.score for r in results}
        assert scores.get("Teacher Scheme", 0) >= scores.get("Farmer Scheme", 0)

    def test_profile_with_multiple_matching_schemes(self, engine):
        from scheme_service.app.models.scheme import Scheme

        schemes = [
            Scheme(
                name="BPL Scheme",
                category="social",
                eligibility_criteria={"bpl": {"required": True}},
                benefits={},
                required_documents=[],
                is_active=True,
                tags=[],
            ),
            Scheme(
                name="Disability Scheme",
                category="social",
                eligibility_criteria={"disability": {"required": True}},
                benefits={},
                required_documents=[],
                is_active=True,
                tags=[],
            ),
            Scheme(
                name="Universal Scheme",
                category="general",
                eligibility_criteria={},
                benefits={},
                required_documents=[],
                is_active=True,
                tags=[],
            ),
        ]

        citizen = make_profile(is_bpl=True, has_disability=True)
        results = engine.batch_check(citizen, schemes)
        eligible = [r for r in results if r.eligible]
        assert len(eligible) >= 2


class TestSchemeMatchingFallback:
    def test_fallback_when_no_schemes_match(self, engine):
        from scheme_service.app.models.scheme import Scheme

        scheme = Scheme(
            name="Kerala Specific Scheme",
            category="state_specific",
            eligibility_criteria={
                "state": {"states": ["Kerala"]},
                "income": {"ceiling": 50000},
            },
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )

        citizen = make_profile(state="Punjab", annual_income=500000)
        result = engine.check_eligibility(citizen, scheme)
        assert result.eligible is False

        with_high_income = make_profile(state="Kerala", annual_income=500000)
        result2 = engine.check_eligibility(with_high_income, scheme)
        assert result2.eligible is False


class TestSchemeMatchingEdgeCases:
    def test_missing_data_partial_profile(self, engine):
        from scheme_service.app.models.scheme import Scheme

        scheme = Scheme(
            name="Test Scheme",
            category="general",
            eligibility_criteria={
                "age": {"min": 18, "max": 60},
                "income": {"ceiling": 500000},
                "occupation": ["farmer"],
                "state": {"states": ["Maharashtra"]},
            },
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )

        empty_profile = make_profile(
            date_of_birth=None,
            state=None,
            annual_income=None,
            occupation=None,
            is_farmer=False,
        )
        result = engine.check_eligibility(empty_profile, scheme)
        assert result.eligible is True

    def test_partial_profile_with_some_data(self, engine):
        from scheme_service.app.models.scheme import Scheme

        scheme = Scheme(
            name="Youth Scheme",
            category="education",
            eligibility_criteria={
                "age": {"min": 18, "max": 35},
                "state": {"states": ["Uttar Pradesh"]},
            },
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )

        partial = make_profile(
            date_of_birth=date(2000, 1, 1),
            state="Uttar Pradesh",
            annual_income=None,
            occupation=None,
            caste_category=None,
        )
        result = engine.check_eligibility(partial, scheme)
        assert result.eligible is True

    def test_empty_criteria(self, engine):
        from scheme_service.app.models.scheme import Scheme

        scheme = Scheme(
            name="Open Scheme",
            category="general",
            eligibility_criteria={},
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )

        any_citizen = make_profile()
        result = engine.check_eligibility(any_citizen, scheme)
        assert result.eligible is True
        assert result.score == 1.0

    def test_scheme_with_all_restrictions(self, engine):
        from scheme_service.app.models.scheme import Scheme

        scheme = Scheme(
            name="Narrow Scheme",
            category="specific",
            eligibility_criteria={
                "age": {"min": 25, "max": 35},
                "income": {"ceiling": 200000},
                "state": {"states": ["Goa"]},
                "gender": ["female"],
                "caste": {"categories": ["sc"]},
                "occupation": ["doctor"],
                "disability": {"required": True, "types": ["visual"]},
                "bpl": {"required": True},
            },
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )

        citizen = make_profile(
            _age=30,
            annual_income=150000,
            state="Goa",
            gender="female",
            caste_category="sc",
            occupation="doctor",
            is_farmer=False,
            has_disability=True,
            disability_type="visual",
            is_bpl=True,
        )
        result = engine.check_eligibility(citizen, scheme)
        assert result.eligible is True

    def test_age_derived_from_dob(self, engine):
        profile = make_profile(date_of_birth=date(2000, 6, 15))
        age = profile.age
        assert age is not None
        assert age > 0


class TestAISchemeRanking:
    def test_scheme_ranking_with_ai(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        profile = {"name": "Ramesh", "age": 34, "occupation": "farmer"}
        schemes = [
            {"name": "PM Kisan", "category": "agriculture"},
            {"name": "Health Scheme", "category": "health"},
        ]
        ranked = client.rank_schemes_by_relevance(profile, schemes)
        assert len(ranked) > 0
        assert ranked[0]["relevance_score"] > 50

    def test_scheme_ranking_empty_fallback(self, mock_gemini):
        mock_gemini.rank_schemes_by_relevance.return_value = []

        ranked = mock_gemini.rank_schemes_by_relevance({}, [])
        assert len(ranked) == 0
