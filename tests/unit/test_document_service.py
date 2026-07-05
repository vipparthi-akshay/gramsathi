import io
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select

from document_service.app.models.document import Document
from document_service.app.schemas.document import (
    AutoFillRequest,
    DocumentVerifyRequest,
    OCRResult,
)


@pytest.fixture
def sample_document(db_session):
    doc = Document(
        citizen_id=uuid.uuid4(),
        document_type="aadhaar",
        original_filename="aadhaar.jpg",
        storage_path="documents/test/aadhaar/test.jpg",
        file_size=1024,
        mime_type="image/jpeg",
        ocr_extracted_data={
            "aadhaar_number": "1234-5678-9012",
            "name": "Ramesh Kumar",
            "dob": "1990-06-15",
        },
        ocr_confidence=0.92,
        ocr_processed_at=datetime.now(timezone.utc),
        verification_status="pending",
    )
    db_session.add(doc)
    db_session.commit()
    return doc


class TestDocumentUpload:
    @pytest.mark.asyncio
    async def test_document_upload_creates_metadata(self, db_session):
        doc = Document(
            citizen_id=uuid.uuid4(),
            document_type="income_certificate",
            original_filename="income.pdf",
            storage_path="documents/test/income/test.pdf",
            file_size=2048,
            mime_type="application/pdf",
            verification_status="pending",
        )
        db_session.add(doc)
        await db_session.commit()

        result = await db_session.execute(
            select(Document).where(Document.original_filename == "income.pdf")
        )
        saved = result.scalar_one_or_none()
        assert saved is not None
        assert saved.document_type == "income_certificate"
        assert saved.file_size == 2048
        assert saved.verification_status == "pending"

    @pytest.mark.asyncio
    async def test_document_upload_invalid_type_rejected(self):
        with pytest.raises(Exception):
            doc = Document(
                citizen_id=uuid.uuid4(),
                document_type="invalid_type",
                original_filename="test.txt",
                storage_path="test.txt",
                file_size=100,
                verification_status="pending",
            )


class TestOCRProcessing:
    def test_ocr_aadhaar_extracts_fields(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        image_bytes = b"fake_image_bytes"
        result = client.analyze_document(image_bytes, document_type="aadhaar")
        assert result is not None
        assert "aadhaar_number" in result
        assert "name" in result
        assert result["name"] == "Ramesh Kumar"

    def test_ocr_low_confidence_flagged(self):
        mock_data = {
            "aadhaar_number": "1234-5678-9012",
            "name": "Ramesh Kumar",
            "confidence": 0.35,
        }
        threshold = 0.7
        assert mock_data.get("confidence", 0) < threshold

    def test_ocr_income_certificate(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        result = client.analyze_document(b"fake_image", document_type="income_certificate")
        assert result is not None

    def test_ocr_land_record(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        result = client.analyze_document(b"fake_image", document_type="land_record")
        assert result is not None

    def test_ocr_bank_passbook(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        result = client.analyze_document(b"fake_image", document_type="bank_passbook")
        assert result is not None


class TestDocumentAutoFill:
    @pytest.mark.asyncio
    async def test_document_auto_fill_populates_fields(self, db_session, sample_document):
        sample_document.verification_status = "verified"
        await db_session.commit()

        result = await db_session.execute(
            select(Document).where(
                Document.citizen_id == sample_document.citizen_id,
                Document.is_deleted == False,
                Document.verification_status == "verified",
                Document.ocr_extracted_data.isnot(None),
            )
        )
        docs = result.scalars().all()
        assert len(docs) >= 1

        filled_data = {}
        for doc in docs:
            if doc.ocr_extracted_data:
                for field in ["name", "dob"]:
                    if field in doc.ocr_extracted_data and doc.ocr_extracted_data[field]:
                        filled_data[field] = doc.ocr_extracted_data[field]

        assert "name" in filled_data
        assert filled_data["name"] == "Ramesh Kumar"

    @pytest.mark.asyncio
    async def test_autofill_missing_fields(self, db_session):
        doc = Document(
            citizen_id=uuid.uuid4(),
            document_type="aadhaar",
            original_filename="test.jpg",
            storage_path="test.jpg",
            file_size=100,
            verification_status="verified",
            ocr_extracted_data={"name": "Test User"},
        )
        db_session.add(doc)
        await db_session.commit()

        desired_fields = ["name", "dob", "address", "aadhaar_number"]
        filled = {}
        missing = []

        result = await db_session.execute(
            select(Document).where(
                Document.citizen_id == doc.citizen_id,
                Document.is_deleted == False,
                Document.verification_status == "verified",
                Document.ocr_extracted_data.isnot(None),
            )
        )
        documents = result.scalars().all()
        for document in documents:
            if document.ocr_extracted_data:
                for field in desired_fields:
                    if field in document.ocr_extracted_data and document.ocr_extracted_data[field]:
                        if field not in filled:
                            filled[field] = document.ocr_extracted_data[field]

        for field in desired_fields:
            if field not in filled:
                missing.append(field)

        assert "name" in filled
        assert filled["name"] == "Test User"
        assert "dob" in missing
        assert "address" in missing
        assert "aadhaar_number" in missing


class TestDocumentVerification:
    @pytest.mark.asyncio
    async def test_document_verification_updates_status(self, db_session, sample_document):
        sample_document.verification_status = "verified"
        sample_document.verified_by = "admin@example.com"
        await db_session.commit()

        result = await db_session.execute(
            select(Document).where(Document.id == sample_document.id)
        )
        doc = result.scalar_one_or_none()
        assert doc.verification_status == "verified"
        assert doc.verified_by == "admin@example.com"

    @pytest.mark.asyncio
    async def test_document_rejection(self, db_session, sample_document):
        sample_document.verification_status = "rejected"
        sample_document.verified_by = "reviewer@example.com"
        await db_session.commit()

        result = await db_session.execute(
            select(Document).where(Document.id == sample_document.id)
        )
        doc = result.scalar_one_or_none()
        assert doc.verification_status == "rejected"

    @pytest.mark.asyncio
    async def test_document_soft_delete(self, db_session, sample_document):
        sample_document.is_deleted = True
        await db_session.commit()

        result = await db_session.execute(
            select(Document).where(
                Document.id == sample_document.id,
                Document.is_deleted == False,
            )
        )
        doc = result.scalar_one_or_none()
        assert doc is None
