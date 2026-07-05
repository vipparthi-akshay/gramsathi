from datetime import date
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.scheme import Scheme


class EligibilityResult:
    def __init__(self, scheme_id: UUID, scheme_name: str):
        self.scheme_id = scheme_id
        self.scheme_name = scheme_name
        self.eligible: bool = False
        self.score: float = 0.0
        self.breakdown: Dict[str, Any] = {}
        self.missing_requirements: List[str] = []


class CitizenProfile:
    def __init__(
        self,
        id: UUID,
        date_of_birth: Optional[date] = None,
        gender: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        caste_category: Optional[str] = None,
        annual_income: Optional[Decimal] = None,
        occupation: Optional[str] = None,
        is_farmer: bool = False,
        has_disability: bool = False,
        disability_type: Optional[str] = None,
        education_level: Optional[str] = None,
        land_holding: Optional[float] = None,
        is_bpl: bool = False,
        age: Optional[int] = None,
    ):
        self.id = id
        self.date_of_birth = date_of_birth
        self.gender = gender
        self.state = state
        self.district = district
        self.caste_category = caste_category
        self.annual_income = annual_income
        self.occupation = occupation
        self.is_farmer = is_farmer
        self.has_disability = has_disability
        self.disability_type = disability_type
        self.education_level = education_level
        self.land_holding = land_holding
        self.is_bpl = is_bpl
        self._age = age

    @property
    def age(self) -> Optional[int]:
        if self._age is not None:
            return self._age
        if self.date_of_birth:
            today = date.today()
            return (
                today.year
                - self.date_of_birth.year
                - (
                    (today.month, today.day)
                    < (self.date_of_birth.month, self.date_of_birth.day)
                )
            )
        return None


class EligibilityEngine:
    WEIGHTS = {
        "age": 0.15,
        "income": 0.20,
        "state": 0.15,
        "gender": 0.05,
        "caste": 0.10,
        "occupation": 0.10,
        "disability": 0.05,
        "land_holding": 0.05,
        "education": 0.05,
        "bpl": 0.10,
    }

    def check_eligibility(self, citizen: CitizenProfile, scheme: Scheme) -> EligibilityResult:
        result = EligibilityResult(scheme_id=scheme.id, scheme_name=scheme.name)
        criteria = scheme.eligibility_criteria or {}
        score = 0.0
        weight_sum = 0.0
        passed = 0
        total = 0

        checks = [
            ("age", self._check_age, self.WEIGHTS.get("age", 0.1)),
            ("income", self._check_income, self.WEIGHTS.get("income", 0.15)),
            ("state", self._check_state, self.WEIGHTS.get("state", 0.1)),
            ("gender", self._check_gender, self.WEIGHTS.get("gender", 0.05)),
            ("caste", self._check_caste, self.WEIGHTS.get("caste", 0.1)),
            ("occupation", self._check_occupation, self.WEIGHTS.get("occupation", 0.1)),
            ("disability", self._check_disability, self.WEIGHTS.get("disability", 0.05)),
            ("land_holding", self._check_land_holding, self.WEIGHTS.get("land_holding", 0.05)),
            ("education", self._check_education, self.WEIGHTS.get("education", 0.05)),
            ("bpl", self._check_bpl, self.WEIGHTS.get("bpl", 0.1)),
        ]

        for check_name, check_fn, weight in checks:
            criterion = criteria.get(check_name)
            if criterion is None:
                continue
            total += 1
            check_result = check_fn(citizen, criterion, criteria)
            result.breakdown[check_name] = check_result

            if check_result.get("passed", False):
                score += weight * check_result.get("score", 1.0)
                weight_sum += weight
                passed += 1
            else:
                weight_sum += weight
                msg = check_result.get("reason", f"Failed {check_name} check")
                result.missing_requirements.append(msg)

        if weight_sum > 0:
            result.score = round(score / weight_sum, 4)
        else:
            result.score = 1.0 if total == 0 else 0.0

        result.eligible = result.score >= 0.5 and passed > 0
        return result

    def batch_check(
        self, citizen: CitizenProfile, schemes: List[Scheme]
    ) -> List[EligibilityResult]:
        return [self.check_eligibility(citizen, s) for s in schemes]

    def _check_age(self, citizen: CitizenProfile, criterion: Any, _all: dict) -> dict:
        citizen_age = citizen.age
        if citizen_age is None:
            return {"passed": True, "score": 0.5, "reason": "Age unknown, assuming eligible"}

        age_min = criterion.get("min") if isinstance(criterion, dict) else None
        age_max = criterion.get("max") if isinstance(criterion, dict) else None

        if age_min is not None and citizen_age < int(age_min):
            return {
                "passed": False,
                "score": 0.0,
                "reason": f"Age {citizen_age} < minimum {age_min}",
            }
        if age_max is not None and citizen_age > int(age_max):
            return {
                "passed": False,
                "score": 0.0,
                "reason": f"Age {citizen_age} > maximum {age_max}",
            }

        range_size = (int(age_max or 120) - int(age_min or 0)) or 1
        position = (citizen_age - int(age_min or 0)) / range_size
        age_score = max(0.5, 1.0 - abs(position - 0.5))
        return {"passed": True, "score": round(age_score, 2), "reason": "Age within range"}

    def _check_income(self, citizen: CitizenProfile, criterion: Any, _all: dict) -> dict:
        income = citizen.annual_income
        if income is None:
            return {"passed": True, "score": 0.5, "reason": "Income unknown, assuming eligible"}

        ceiling = criterion.get("ceiling") if isinstance(criterion, dict) else criterion
        if ceiling is None:
            return {"passed": True, "score": 1.0, "reason": "No income ceiling"}

        ceiling = float(ceiling)
        income_val = float(income)
        if income_val > ceiling:
            return {
                "passed": False,
                "score": 0.0,
                "reason": f"Income {income_val} > ceiling {ceiling}",
            }

        score = 1.0 - (income_val / ceiling) * 0.5
        return {"passed": True, "score": round(score, 2), "reason": "Income within limit"}

    def _check_state(self, citizen: CitizenProfile, criterion: Any, _all: dict) -> dict:
        if not criterion:
            return {"passed": True, "score": 1.0, "reason": "No state restriction"}

        if isinstance(criterion, dict):
            included = criterion.get("states", [])
            excluded = criterion.get("excluded_states", [])
        elif isinstance(criterion, list):
            included = criterion
            excluded = []
        else:
            return {"passed": True, "score": 1.0, "reason": "Invalid state criterion"}

        if citizen.state and citizen.state in excluded:
            return {
                "passed": False,
                "score": 0.0,
                "reason": f"State {citizen.state} is excluded",
            }

        if included and citizen.state not in included:
            return {
                "passed": False,
                "score": 0.0,
                "reason": f"State {citizen.state} not in eligible states",
            }

        return {"passed": True, "score": 1.0, "reason": "State eligible"}

    def _check_gender(self, citizen: CitizenProfile, criterion: Any, _all: dict) -> dict:
        if not criterion:
            return {"passed": True, "score": 1.0, "reason": "No gender restriction"}

        allowed = criterion if isinstance(criterion, list) else [criterion]
        if citizen.gender and citizen.gender.lower() in [a.lower() for a in allowed]:
            return {"passed": True, "score": 1.0, "reason": "Gender eligible"}
        if citizen.gender is None:
            return {"passed": True, "score": 0.5, "reason": "Gender unknown"}

        return {
            "passed": False,
            "score": 0.0,
            "reason": f"Gender {citizen.gender} not eligible",
        }

    def _check_caste(self, citizen: CitizenProfile, criterion: Any, _all: dict) -> dict:
        if not criterion:
            return {"passed": True, "score": 1.0, "reason": "No caste restriction"}

        allowed = criterion.get("categories") if isinstance(criterion, dict) else (
            criterion if isinstance(criterion, list) else [criterion]
        )

        if citizen.caste_category and citizen.caste_category in allowed:
            return {"passed": True, "score": 1.0, "reason": "Caste eligible"}
        if citizen.caste_category is None:
            return {"passed": True, "score": 0.5, "reason": "Caste unknown"}

        # Check if it's a reservation - if SC/ST/OBC are allowed, general may still apply
        if isinstance(criterion, dict) and criterion.get("open_to_all", False):
            return {"passed": True, "score": 0.8, "reason": "Open to all categories"}

        return {
            "passed": False,
            "score": 0.0,
            "reason": f"Caste {citizen.caste_category} not eligible",
        }

    def _check_occupation(self, citizen: CitizenProfile, criterion: Any, _all: dict) -> dict:
        if not criterion:
            return {"passed": True, "score": 1.0, "reason": "No occupation restriction"}

        required = criterion if isinstance(criterion, list) else [criterion]
        if citizen.is_farmer and "farmer" in [r.lower() for r in required]:
            return {"passed": True, "score": 1.0, "reason": "Occupation: farmer"}
        if citizen.occupation and citizen.occupation.lower() in [r.lower() for r in required]:
            return {"passed": True, "score": 1.0, "reason": "Occupation eligible"}
        if citizen.occupation is None and not citizen.is_farmer:
            return {"passed": True, "score": 0.5, "reason": "Occupation unknown"}

        return {
            "passed": False,
            "score": 0.0,
            "reason": f"Occupation {citizen.occupation} not eligible",
        }

    def _check_disability(self, citizen: CitizenProfile, criterion: Any, _all: dict) -> dict:
        if not criterion:
            return {"passed": True, "score": 1.0, "reason": "No disability restriction"}

        required = criterion.get("required") if isinstance(criterion, dict) else criterion
        if isinstance(required, bool) and required:
            if citizen.has_disability:
                return {"passed": True, "score": 1.0, "reason": "Has disability"}
            return {
                "passed": False,
                "score": 0.0,
                "reason": "Disability required",
            }

        if isinstance(required, list):
            if citizen.has_disability and citizen.disability_type in required:
                return {"passed": True, "score": 1.0, "reason": "Disability type eligible"}
            if citizen.has_disability:
                return {
                    "passed": False,
                    "score": 0.0,
                    "reason": f"Disability type {citizen.disability_type} not eligible",
                }
            return {
                "passed": False,
                "score": 0.0,
                "reason": "Disability required for this scheme",
            }

        return {"passed": True, "score": 1.0, "reason": "No specific disability restriction"}

    def _check_land_holding(self, citizen: CitizenProfile, criterion: Any, _all: dict) -> dict:
        if not criterion:
            return {"passed": True, "score": 1.0, "reason": "No land holding restriction"}

        land = citizen.land_holding
        if land is None:
            return {"passed": True, "score": 0.5, "reason": "Land holding unknown"}

        max_land = criterion.get("max") if isinstance(criterion, dict) else criterion
        if max_land is not None and land > float(max_land):
            return {
                "passed": False,
                "score": 0.0,
                "reason": f"Land {land} > maximum {max_land}",
            }

        min_land = criterion.get("min") if isinstance(criterion, dict) else None
        if min_land is not None and land < float(min_land):
            return {
                "passed": False,
                "score": 0.0,
                "reason": f"Land {land} < minimum {min_land}",
            }

        return {"passed": True, "score": 1.0, "reason": "Land holding within range"}

    def _check_education(self, citizen: CitizenProfile, criterion: Any, _all: dict) -> dict:
        if not criterion:
            return {"passed": True, "score": 1.0, "reason": "No education restriction"}

        min_level = criterion.get("min") if isinstance(criterion, dict) else criterion
        if not min_level:
            return {"passed": True, "score": 1.0, "reason": "No education restriction"}

        if citizen.education_level is None:
            return {"passed": True, "score": 0.5, "reason": "Education level unknown"}

        levels = ["none", "primary", "middle", "secondary", "higher_secondary", "graduate", "post_graduate", "doctorate"]
        citizen_idx = levels.index(citizen.education_level.lower()) if citizen.education_level.lower() in levels else -1
        min_idx = levels.index(min_level.lower()) if min_level.lower() in levels else -1

        if citizen_idx >= min_idx:
            return {"passed": True, "score": 1.0, "reason": "Education level met"}
        return {
            "passed": False,
            "score": 0.0,
            "reason": f"Education {citizen.education_level} below minimum {min_level}",
        }

    def _check_bpl(self, citizen: CitizenProfile, criterion: Any, _all: dict) -> dict:
        if not criterion:
            return {"passed": True, "score": 1.0, "reason": "No BPL restriction"}

        required = criterion.get("required") if isinstance(criterion, dict) else criterion
        if isinstance(required, bool):
            if required and not citizen.is_bpl:
                return {
                    "passed": False,
                    "score": 0.0,
                    "reason": "BPL required",
                }
            return {"passed": True, "score": 1.0, "reason": "BPL status met"}
        return {"passed": True, "score": 1.0, "reason": "No BPL restriction"}
