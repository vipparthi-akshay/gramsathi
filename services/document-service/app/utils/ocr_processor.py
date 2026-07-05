import io
import json
import logging
from typing import Any, Dict, Optional

from google.cloud import documentai, storage, vision
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

DOCUMENT_TYPE_MAP = {
    "aadhaar": settings.DOCUMENT_AI_PROCESSOR_AADHAAR,
    "income_certificate": settings.DOCUMENT_AI_PROCESSOR_INCOME,
    "land_record": settings.DOCUMENT_AI_PROCESSOR_LAND_RECORD,
    "bank_passbook": settings.DOCUMENT_AI_PROCESSOR_BANK_PASSBOOK,
}

FIELD_EXTRACTORS = {
    "aadhaar": ["aadhaar_number", "name", "dob", "gender", "address", "father_name"],
    "income_certificate": [
        "certificate_number", "name", "annual_income",
        "issue_date", "issuing_authority", "valid_until",
    ],
    "land_record": ["survey_number", "owner_name", "village", "district", "area", "land_type", "khata_number"],
    "bank_passbook": ["account_number", "ifsc_code", "account_holder", "bank_name", "branch", "account_type"],
}


class OCRProcessor:

    def __init__(self):
        self.storage_client = storage.Client(project=settings.GCP_PROJECT_ID) if settings.GCP_PROJECT_ID else None
        self.vision_client = vision.ImageAnnotatorClient() if settings.GCP_PROJECT_ID else None
        self.docai_client = documentai.DocumentProcessorServiceClient() if settings.GCP_PROJECT_ID else None
        self.bucket = None
        if self.storage_client and settings.GCS_BUCKET_NAME:
            try:
                self.bucket = self.storage_client.bucket(settings.GCS_BUCKET_NAME)
            except Exception as e:
                logger.warning(f"Failed to access bucket {settings.GCS_BUCKET_NAME}: {e}")

    async def process_document(self, image_data: bytes, document_type: str) -> Dict[str, Any]:
        extracted = {
            "raw_text": "",
            "extracted_fields": {},
            "confidence": 0.0,
            "document_type": document_type,
            "processor_used": "none",
        }

        processor_name = DOCUMENT_TYPE_MAP.get(document_type)
        if processor_name and self.docai_client:
            try:
                result = await self._process_with_docai(image_data, processor_name, document_type)
                if result and result.get("confidence", 0) >= settings.OCR_CONFIDENCE_THRESHOLD:
                    result["processor_used"] = "document_ai"
                    return result
                elif result:
                    extracted = result
            except Exception as e:
                logger.warning(f"Document AI failed for {document_type}: {e}")

        if self.vision_client:
            try:
                result = await self._process_with_vision(image_data, document_type)
                result["processor_used"] = "cloud_vision"
                return result
            except Exception as e:
                logger.warning(f"Cloud Vision failed for {document_type}: {e}")

        return extracted

    async def _process_with_docai(
        self, image_data: bytes, processor_name: str, document_type: str
    ) -> Optional[Dict[str, Any]]:
        mime_type = self._detect_mime_type(image_data)
        document = documentai.RawDocument(content=image_data, mime_type=mime_type)
        request = documentai.ProcessRequest(name=processor_name, raw_document=document)
        result = await self.docai_client.process_document(request=request)
        document = result.document

        fields = {}
        entities = document.entities if document.entities else []
        for entity in entities:
            fields[entity.type_] = entity.mention_text
            confidence = float(entity.confidence) if entity.confidence else 0.0

        raw_text = document.text if document.text else ""
        confidence = float(document.confidence) if document.confidence else 0.0

        structured = {}
        expected_fields = FIELD_EXTRACTORS.get(document_type, [])
        for field in expected_fields:
            structured[field] = fields.get(field, "")

        return {
            "raw_text": raw_text,
            "extracted_fields": structured,
            "confidence": confidence,
            "document_type": document_type,
        }

    async def _process_with_vision(self, image_data: bytes, document_type: str) -> Dict[str, Any]:
        image = vision.Image(content=image_data)
        response = await self.vision_client.text_detection(image=image)
        annotations = response.text_annotations

        raw_text = ""
        if annotations:
            raw_text = annotations[0].description

        return {
            "raw_text": raw_text,
            "extracted_fields": self._extract_fields_from_text(raw_text, document_type),
            "confidence": (
                float(response.full_text_annotation.pages[0].confidence)
                if response.full_text_annotation.pages else 0.0
            ),
            "document_type": document_type,
        }

    def _extract_fields_from_text(self, text: str, document_type: str) -> Dict[str, str]:
        fields = {}
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        expected = FIELD_EXTRACTORS.get(document_type, [])
        for i, line in enumerate(lines):
            for field in expected:
                if field.lower().replace("_", " ") in line.lower():
                    parts = line.split(":", 1)
                    if len(parts) > 1:
                        fields[field] = parts[1].strip()
                    elif i + 1 < len(lines):
                        fields[field] = lines[i + 1]
        return fields

    def _detect_mime_type(self, image_data: bytes) -> str:
        if image_data[:4] == b"%PDF":
            return "application/pdf"
        try:
            img = Image.open(io.BytesIO(image_data))
            fmt = img.format or "JPEG"
            return f"image/{fmt.lower()}"
        except Exception:
            return "image/jpeg"

    async def validate_extracted_data(self, data: Dict[str, Any], document_type: str) -> Dict[str, Any]:
        expected = FIELD_EXTRACTORS.get(document_type, [])
        missing = [f for f in expected if not data.get("extracted_fields", {}).get(f)]
        has_required = len(missing) < len(expected)

        authenticity_score = 0.0
        if settings.GEMINI_API_KEY and has_required:
            try:
                authenticity_score = await self._check_authenticity(data, document_type)
            except Exception as e:
                logger.warning(f"Authenticity check failed: {e}")

        return {
            "is_valid": has_required,
            "missing_fields": missing,
            "completeness": (len(expected) - len(missing)) / len(expected) if expected else 0.0,
            "authenticity_score": authenticity_score,
        }

    async def _check_authenticity(self, data: Dict[str, Any], document_type: str) -> float:
        try:
            import httpx
            prompt = f"""Analyze this {document_type} document data for authenticity.
Extracted text: {data.get('raw_text', '')[:1000]}
Fields: {json.dumps(data.get('extracted_fields', {}))}
Return a JSON with a single field 'authenticity_score' between 0.0 and 1.0."""
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
                    params={"key": settings.GEMINI_API_KEY},
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                )
                if resp.status_code == 200:
                    result = resp.json()
                    text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                    clean = text.strip().strip("```json").strip("```").strip()
                    score_data = json.loads(clean)
                    return float(score_data.get("authenticity_score", 0.5))
        except Exception as e:
            logger.warning(f"Authenticity check error: {e}")
        return 0.5

    async def generate_presigned_url(self, storage_path: str, expiry: int = 3600) -> Optional[str]:
        if not self.bucket:
            return None
        try:
            blob = self.bucket.blob(storage_path)
            url = blob.generate_signed_url(
                version="v4",
                expiration=expiry,
                method="GET",
            )
            return url
        except Exception as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None

    async def upload_to_gcs(self, file_data: bytes, destination_path: str, content_type: str) -> bool:
        if not self.bucket:
            return False
        try:
            blob = self.bucket.blob(destination_path)
            blob.upload_from_string(file_data, content_type=content_type)
            return True
        except Exception as e:
            logger.error(f"GCS upload failed: {e}")
            return False

    async def delete_from_gcs(self, storage_path: str) -> bool:
        if not self.bucket:
            return False
        try:
            blob = self.bucket.blob(storage_path)
            blob.delete()
            return True
        except Exception as e:
            logger.error(f"GCS delete failed: {e}")
            return False
