import uuid
from datetime import date

import pytest

from scheme_service.app.models.scheme import Scheme
from scheme_service.app.utils.eligibility_engine import (
    CitizenProfile,
    EligibilityEngine,
)


@pytest.fixture
def engine():
    return EligibilityEngine()


def make_citizen(**kwargs):
    defaults = {
        "id": uuid.uuid4(),
        "date_of_birth": date(1990, 1, 1),
        "gender": "male",
        "state": "Maharashtra",
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


def make_scheme(criteria: dict) -> Scheme:
    return Scheme(
        name="Test Scheme",
        category="test",
        eligibility_criteria=criteria,
        benefits={},
        required_documents=[],
        is_active=True,
        tags=[],
    )


class TestAgeEligibility:
    def test_age_boundary_minimum_exact(self, engine):
        citizen = make_citizen(date_of_birth=date(2006, 1, 1))
        scheme = make_scheme({"age": {"min": 18, "max": 60}})
        result = engine.check_eligibility(citizen, scheme)
        assert result.eligible is True

    def test_age_boundary_just_below_minimum(self, engine):
        citizen = make_citizen(_age=17)
        scheme = make_scheme({"age": {"min": 18, "max": 60}})
        result = engine.check_eligibility(citizen, scheme)
        assert result.eligible is False

    def test_age_boundary_maximum_exact(self, engine):
        citizen = make_citizen(_age=60)
        scheme = make_scheme({"age": {"min": 18, "max": 60}})
        result = engine.check_eligibility(citizen, scheme)
        assert result.eligible is True

    def test_age_boundary_just_above_maximum(self, engine):
        citizen = make_citizen(_age=61)
        scheme = make_scheme({"age": {"min": 18, "max": 60}})
        result = engine.check_eligibility(citizen, scheme)
        assert result.eligible is False

    def test_age_no_minimum(self, engine):
        citizen = make_citizen(_age=5)
        scheme = make_scheme({"age": {"max": 18}})
        result = engine._check_age(citizen, {"max": 18}, {})
        assert result["passed"] is True

    def test_age_no_maximum(self, engine):
        citizen = make_citizen(_age=80)
        scheme = make_scheme({"age": {"min": 60}})
        result = engine._check_age(citizen, {"min": 60}, {})
        assert result["passed"] is True

    def test_age_unknown(self, engine):
        citizen = make_citizen(date_of_birth=None, _age=None)
        result = engine._check_age(citizen, {"min": 18, "max": 60}, {})
        assert result["passed"] is True


class TestIncomeEligibility:
    def test_income_below_ceiling(self, engine):
        citizen = make_citizen(annual_income=250000)
        scheme = make_scheme({"income": {"ceiling": 500000}})
        result = engine._check_income(citizen, {"ceiling": 500000}, {})
        assert result["passed"] is True
        assert result["score"] > 0.5

    def test_income_equal_ceiling(self, engine):
        citizen = make_citizen(annual_income=500000)
        scheme = make_scheme({"income": {"ceiling": 500000}})
        result = engine._check_income(citizen, {"ceiling": 500000}, {})
        assert result["passed"] is True

    def test_income_above_ceiling(self, engine):
        citizen = make_citizen(annual_income=600000)
        scheme = make_scheme({"income": {"ceiling": 500000}})
        result = engine._check_income(citizen, {"ceiling": 500000}, {})
        assert result["passed"] is False

    def test_income_no_ceiling(self, engine):
        citizen = make_citizen(annual_income=999999999)
        scheme = make_scheme({"income": None})
        result = engine._check_income(citizen, None, {})
        assert result["passed"] is True

    def test_income_unknown(self, engine):
        citizen = make_citizen(annual_income=None)
        result = engine._check_income(citizen, {"ceiling": 500000}, {})
        assert result["passed"] is True
        assert result["score"] == 0.5


class TestStateEligibility:
    def test_state_included(self, engine):
        citizen = make_citizen(state="Maharashtra")
        result = engine._check_state(citizen, {"states": ["Maharashtra", "Gujarat"]}, {})
        assert result["passed"] is True

    def test_state_excluded(self, engine):
        citizen = make_citizen(state="Maharashtra")
        result = engine._check_state(citizen, {"excluded_states": ["Maharashtra"]}, {})
        assert result["passed"] is False

    def test_state_not_in_included(self, engine):
        citizen = make_citizen(state="Kerala")
        result = engine._check_state(citizen, {"states": ["Maharashtra", "Gujarat"]}, {})
        assert result["passed"] is False

    def test_no_state_restriction(self, engine):
        citizen = make_citizen(state="Kerala")
        result = engine._check_state(citizen, None, {})
        assert result["passed"] is True


class TestCasteEligibility:
    def test_caste_matches(self, engine):
        citizen = make_citizen(caste_category="sc")
        result = engine._check_caste(citizen, {"categories": ["sc", "st"]}, {})
        assert result["passed"] is True

    def test_caste_not_in_allowed(self, engine):
        citizen = make_citizen(caste_category="general")
        result = engine._check_caste(citizen, {"categories": ["sc", "st"]}, {})
        assert result["passed"] is False

    def test_caste_open_to_all(self, engine):
        citizen = make_citizen(caste_category="general")
        result = engine._check_caste(citizen, {"categories": ["sc", "st", "obc"], "open_to_all": True}, {})
        assert result["passed"] is True

    def test_caste_unknown(self, engine):
        citizen = make_citizen(caste_category=None)
        result = engine._check_caste(citizen, {"categories": ["sc", "st"]}, {})
        assert result["passed"] is True
        assert result["score"] == 0.5


class TestDisabilityEligibility:
    def test_disability_required_and_has(self, engine):
        citizen = make_citizen(has_disability=True)
        result = engine._check_disability(citizen, {"required": True}, {})
        assert result["passed"] is True

    def test_disability_required_but_not(self, engine):
        citizen = make_citizen(has_disability=False)
        result = engine._check_disability(citizen, {"required": True}, {})
        assert result["passed"] is False

    def test_disability_type_matches(self, engine):
        citizen = make_citizen(has_disability=True, disability_type="visual")
        result = engine._check_disability(citizen, {"required": True, "types": ["visual", "hearing"]}, {})
        assert result["passed"] is True

    def test_disability_type_not_matches(self, engine):
        citizen = make_citizen(has_disability=True, disability_type="locomotor")
        result = engine._check_disability(citizen, {"required": True, "types": ["visual"]}, {})
        assert result["passed"] is False

    def test_no_disability_restriction(self, engine):
        citizen = make_citizen(has_disability=True)
        result = engine._check_disability(citizen, None, {})
        assert result["passed"] is True


class TestOccupationEligibility:
    def test_farmer_matches(self, engine):
        citizen = make_citizen(is_farmer=True, occupation="farmer")
        result = engine._check_occupation(citizen, ["farmer"], {})
        assert result["passed"] is True

    def test_occupation_matches(self, engine):
        citizen = make_citizen(occupation="teacher")
        result = engine._check_occupation(citizen, ["teacher"], {})
        assert result["passed"] is True

    def test_occupation_not_matches(self, engine):
        citizen = make_citizen(occupation="doctor")
        result = engine._check_occupation(citizen, ["teacher"], {})
        assert result["passed"] is False

    def test_occupation_unknown(self, engine):
        citizen = make_citizen(occupation=None, is_farmer=False)
        result = engine._check_occupation(citizen, ["teacher"], {})
        assert result["passed"] is True
        assert result["score"] == 0.5


class TestEducationEligibility:
    def test_education_above_minimum(self, engine):
        citizen = make_citizen(education_level="graduate")
        result = engine._check_education(citizen, {"min": "secondary"}, {})
        assert result["passed"] is True

    def test_education_below_minimum(self, engine):
        citizen = make_citizen(education_level="primary")
        result = engine._check_education(citizen, {"min": "secondary"}, {})
        assert result["passed"] is False

    def test_education_unknown(self, engine):
        citizen = make_citizen(education_level=None)
        result = engine._check_education(citizen, {"min": "secondary"}, {})
        assert result["passed"] is True
        assert result["score"] == 0.5


class TestBPLEligibility:
    def test_bpl_required_and_is_bpl(self, engine):
        citizen = make_citizen(is_bpl=True, annual_income=25000)
        result = engine._check_bpl(citizen, {"required": True}, {})
        assert result["passed"] is True

    def test_bpl_required_not_bpl(self, engine):
        citizen = make_citizen(is_bpl=False, annual_income=100000)
        result = engine._check_bpl(citizen, {"required": True}, {})
        assert result["passed"] is False

    def test_bpl_not_required(self, engine):
        citizen = make_citizen(is_bpl=False)
        result = engine._check_bpl(citizen, {"required": False}, {})
        assert result["passed"] is True


class TestLandHoldingEligibility:
    def test_land_within_max(self, engine):
        citizen = make_citizen(land_holding=3.0)
        result = engine._check_land_holding(citizen, {"max": 5.0}, {})
        assert result["passed"] is True

    def test_land_above_max(self, engine):
        citizen = make_citizen(land_holding=6.0)
        result = engine._check_land_holding(citizen, {"max": 5.0}, {})
        assert result["passed"] is False

    def test_land_unknown(self, engine):
        citizen = make_citizen(land_holding=None)
        result = engine._check_land_holding(citizen, {"max": 5.0}, {})
        assert result["passed"] is True
        assert result["score"] == 0.5
