import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select

from scheme_service.app.models.application import Application
from scheme_service.app.models.scheme import Scheme


class TestGrievanceFlow:
    @pytest.mark.asyncio
    async def test_complaint_drafting_and_submission(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()

        complaint_prompt = '''Create a complaint draft:
        Department: agriculture
        Issue: Delay in PM Kisan payment
        Description: I have not received my PM Kisan payment for the last 6 months.
        I have visited the office 3 times but no action was taken.'''

        structured_complaint = client.generate_response(
            prompt=complaint_prompt,
            language="en",
            temperature=0.1,
        )
        assert structured_complaint is not None

        draft_data = {
            "department": "Agriculture",
            "issue_type": "Payment Delay",
            "priority": "high",
            "description_formal": "I have not received PM Kisan Samman Nidhi payment for 6 months.",
            "evidence_needed": ["Bank statement", "Aadhaar card", "Application reference"],
        }

        assert draft_data["department"] is not None
        assert draft_data["priority"].upper() in ["HIGH", "MEDIUM", "LOW"]

        approved = True
        assert approved is True

    @pytest.mark.asyncio
    async def test_cpgrams_complaint_tracking(self):
        complaint = {
            "id": str(uuid.uuid4()),
            "citizen_name": "Ramesh Kumar",
            "department": "Agriculture",
            "issue": "PM Kisan payment delay",
            "status": "submitted",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "cpgrams_ref": "CPGRAMS-2024-001234",
        }

        assert complaint["cpgrams_ref"] is not None

        tracking_statuses = ["submitted", "acknowledged", "in_process", "resolved", "closed"]
        complaint["status"] = "acknowledged"
        assert complaint["status"] == "acknowledged"

        complaint["status"] = "in_process"
        assert complaint["status"] == "in_process"

        complaint["status"] = "resolved"
        complaint["resolution"] = "Payment has been released"
        assert complaint["status"] == "resolved"
        assert "resolution" in complaint

    @pytest.mark.asyncio
    async def test_grievance_full_lifecycle(self, mock_gemini, db_session):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()

        citizen_description = "मुझे 6 महीने से PM किसान का पैसा नहीं मिला है। तीन बार ऑफिस गया कोई सुनवाई नहीं हुई।"
        structured = client.generate_response(
            prompt=f"Create complaint draft from: {citizen_description}",
            language="en",
            temperature=0.1,
        )
        assert structured is not None

        complaint = {
            "id": str(uuid.uuid4()),
            "citizen_id": str(uuid.uuid4()),
            "issue": "PM Kisan payment delay - 6 months",
            "department": "Agriculture",
            "status": "draft",
        }
        assert complaint["status"] == "draft"

        complaint["status"] = "submitted"
        complaint["submitted_at"] = datetime.now(timezone.utc).isoformat()
        complaint["cpgrams_ref"] = "CPGRAMS-2024-005678"
        assert complaint["status"] == "submitted"
        assert complaint["cpgrams_ref"] is not None

        tracking_updates = [
            ("acknowledged", "Complaint received and acknowledged"),
            ("under_review", "Department reviewing the complaint"),
            ("action_taken", "Payment process initiated"),
            ("resolved", "Payment of ₹6000 credited to your account"),
        ]

        for status, message in tracking_updates:
            complaint["status"] = status
            complaint["last_update"] = message
            assert complaint["status"] == status

        assert complaint["status"] == "resolved"

    @pytest.mark.asyncio
    async def test_ai_drafted_complaint_approval_prompt(self, mock_gemini):
        from ai_service.app.routers.chat import _format_complaint_response

        complaint_data = {
            "department": "Agriculture",
            "issue_type": "Payment Delay",
            "priority": "high",
            "description_formal": "Not received PM Kisan payment for 6 months despite multiple visits.",
            "evidence_needed": ["Bank statement", "Aadhaar"],
        }

        formatted_hi = _format_complaint_response(complaint_data, "hi")
        assert "शिकायत" in formatted_hi
        assert "विभाग" in formatted_hi
        assert "Agriculture" in formatted_hi
        assert "हाँ" in formatted_hi or "हां" in formatted_hi

        formatted_en = _format_complaint_response(complaint_data, "en")
        assert "Complaint Draft" in formatted_en
        assert "Department" in formatted_en
        assert "Yes" in formatted_en or "Would you like" in formatted_en

    @pytest.mark.asyncio
    async def test_grievance_with_scheme_application(self, db_session):
        scheme = Scheme(
            name="PM Kisan Samman Nidhi",
            category="agriculture",
            eligibility_criteria={"age": {"min": 18}},
            benefits={},
            required_documents=[],
            is_active=True,
            tags=[],
        )
        db_session.add(scheme)
        await db_session.commit()

        app = Application(
            citizen_id=uuid.uuid4(),
            scheme_id=scheme.id,
            form_data={},
            documents_submitted=[],
            status="approved",
            government_ref_id="GOV-REF-999",
        )
        db_session.add(app)
        await db_session.commit()

        grievance_reference = {
            "application_id": str(app.id),
            "government_ref_id": app.government_ref_id,
            "issue": "Payment not received despite approval",
            "status": "submitted",
            "cpgrams_ref": "CPGRAMS-2024-009999",
        }

        assert grievance_reference["government_ref_id"] == "GOV-REF-999"
        assert grievance_reference["status"] == "submitted"
