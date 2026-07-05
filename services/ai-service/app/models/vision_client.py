import base64
import json
from typing import Any, Dict, List, Optional

from google.cloud import documentai
from google.cloud.documentai import Document as DocumentAIDocument

from app.config import settings
from app.models.gemini_client import GeminiClient


class DocumentAnalysis:
    def __init__(
        self,
        document_type: str,
        raw_text: str,
        extracted_fields: Dict[str, Any],
        confidence: float,
        entities: Optional[List[Dict]] = None,
        pages: Optional[List[Dict]] = None,
    ):
        self.document_type = document_type
        self.raw_text = raw_text
        self.extracted_fields = extracted_fields
        self.confidence = confidence
        self.entities = entities or []
        self.pages = pages or []


class ValidationResult:
    def __init__(
        self,
        is_valid: bool,
        score: float,
        flags: Optional[List[Dict]] = None,
        field_consistency: Optional[Dict[str, bool]] = None,
    ):
        self.is_valid = is_valid
        self.score = score
        self.flags = flags or []
        self.field_consistency = field_consistency or {}


DOCUMENT_TYPE_PROCESSORS = {
    "aadhaar": "aadhaar-processor",
    "pan": "pan-processor",
    "income_certificate": "income-cert-processor",
    "caste_certificate": "caste-cert-processor",
    "land_record": "land-record-processor",
    "bank_passbook": "bank-passbook-processor",
    "ration_card": "ration-card-processor",
    "voter_id": "voter-id-processor",
    "driving_license": "dl-processor",
    "birth_certificate": "birth-cert-processor",
    "death_certificate": "death-cert-processor",
    "domicile": "domicile-processor",
    "general": "general-document-processor",
}


class VisionClient:
    def __init__(self):
        self.gemini = GeminiClient()
        self._docai_client: Optional[documentai.DocumentProcessorServiceClient] = None

    @property
    def docai_client(self) -> documentai.DocumentProcessorServiceClient:
        if self._docai_client is None:
            self._docai_client = documentai.DocumentProcessorServiceClient()
        return self._docai_client

    def _get_docai_processor_name(self, document_type: str) -> Optional[str]:
        processor_id = DOCUMENT_TYPE_PROCESSORS.get(document_type)
        if processor_id is None:
            return None
        return (
            f"projects/{settings.GOOGLE_CLOUD_PROJECT}/locations/us/processors/{processor_id}"
        )

    def _process_with_docai(self, image_bytes: bytes, document_type: str) -> Optional[DocumentAIDocument]:
        processor_name = self._get_docai_processor_name(document_type)
        if not processor_name or not settings.GOOGLE_CLOUD_PROJECT:
            return None

        raw_document = documentai.RawDocument(
            content=image_bytes,
            mime_type="image/jpeg",
        )

        request = documentai.ProcessRequest(
            name=processor_name,
            raw_document=raw_document,
        )

        try:
            result = self.docai_client.process_document(request=request)
            return result.document
        except Exception:
            return None

    def analyze_document_image(
        self,
        image_bytes: bytes,
        document_type: str = "general",
    ) -> DocumentAnalysis:
        docai_doc = self._process_with_docai(image_bytes, document_type)

        gemini_fields = self.gemini.analyze_document(image_bytes, document_type)

        extracted_fields = {}
        docai_confidence = 0.0

        if docai_doc:
            docai_confidence = docai_doc.ml_confidence if hasattr(docai_doc, 'ml_confidence') and docai_doc.ml_confidence else 0.0

            for entity in docai_doc.entities:
                extracted_fields[entity.type_] = {
                    "value": entity.mention_text,
                    "confidence": entity.confidence if hasattr(entity, 'confidence') and entity.confidence else 0.0,
                    "source": "document_ai",
                }

            raw_text = docai_doc.text or ""
        else:
            raw_text = gemini_fields.get("raw_text", "")

        for key, value in gemini_fields.items():
            if key == "raw_text":
                continue
            if key not in extracted_fields:
                if isinstance(value, dict):
                    extracted_fields[key] = {
                        "value": value.get("value", value),
                        "confidence": value.get("confidence", 0.7),
                        "source": "gemini",
                    }
                else:
                    extracted_fields[key] = {
                        "value": value,
                        "confidence": 0.7,
                        "source": "gemini",
                    }

        overall_confidence = max(
            docai_confidence,
            max(
                (f.get("confidence", 0) for f in extracted_fields.values()),
                default=0.0,
            ),
        )

        pages_data = []
        if docai_doc and hasattr(docai_doc, 'pages'):
            for page in docai_doc.pages:
                page_info = {
                    "page_number": page.page_number if hasattr(page, 'page_number') else 0,
                    "dimensions": {
                        "width": page.dimension.width if hasattr(page, 'dimension') and page.dimension else 0,
                        "height": page.dimension.height if hasattr(page, 'dimension') and page.dimension else 0,
                    } if hasattr(page, 'dimension') else {},
                }
                pages_data.append(page_info)

        entities_data = []
        if docai_doc and hasattr(docai_doc, 'entities'):
            for entity in docai_doc.entities:
                entities_data.append({
                    "type": entity.type_,
                    "mention_text": entity.mention_text,
                    "confidence": entity.confidence if hasattr(entity, 'confidence') and entity.confidence else 0.0,
                })

        return DocumentAnalysis(
            document_type=document_type,
            raw_text=raw_text,
            extracted_fields=extracted_fields,
            confidence=overall_confidence,
            entities=entities_data,
            pages=pages_data,
        )

    def validate_extracted_data(
        self,
        extracted_data: Dict[str, Any],
        document_type: str,
    ) -> ValidationResult:
        flags = []
        field_consistency = {}

        fields = extracted_data.get("extracted_fields", extracted_data)
        if not fields:
            return ValidationResult(
                is_valid=False,
                score=0.0,
                flags=[{"field": "general", "severity": "error", "message": "No extracted fields to validate"}],
                field_consistency={},
            )

        for field_name, field_info in fields.items():
            value = field_info if not isinstance(field_info, dict) else field_info.get("value", "")

            if isinstance(field_info, dict):
                confidence = field_info.get("confidence", 1.0)
            else:
                confidence = 1.0

            if document_type == "aadhaar":
                if field_name == "aadhaar_number" and value:
                    clean_num = value.replace(" ", "").replace("-", "")
                    if len(clean_num) == 12 and clean_num.isdigit():
                        field_consistency[f"{field_name}_format"] = True
                    else:
                        field_consistency[f"{field_name}_format"] = False
                        flags.append({
                            "field": field_name,
                            "severity": "error",
                            "message": "Aadhaar number must be 12 digits",
                        })

                if field_name == "dob" and value:
                    field_consistency["dob_present"] = True

            elif document_type == "income_certificate":
                if field_name == "annual_income" and value:
                    try:
                        income_val = float(str(value).replace(",", "").replace("₹", "").replace("Rs.", "").strip())
                        if income_val <= 0:
                            flags.append({
                                "field": field_name,
                                "severity": "error",
                                "message": "Annual income must be greater than 0",
                            })
                            field_consistency[f"{field_name}_valid"] = False
                        elif income_val > 50000000:
                            flags.append({
                                "field": field_name,
                                "severity": "warning",
                                "message": "Income seems unusually high for an income certificate",
                            })
                            field_consistency[f"{field_name}_valid"] = False
                        else:
                            field_consistency[f"{field_name}_valid"] = True
                    except (ValueError, TypeError):
                        flags.append({
                            "field": field_name,
                            "severity": "error",
                            "message": "Could not parse annual income value",
                        })
                        field_consistency[f"{field_name}_valid"] = False

            elif document_type == "land_record":
                if field_name == "area_acres" and value:
                    try:
                        area = float(str(value).replace(",", "").strip())
                        if area <= 0:
                            flags.append({
                                "field": field_name,
                                "severity": "error",
                                "message": "Land area must be greater than 0",
                            })
                        elif area > 1000:
                            flags.append({
                                "field": field_name,
                                "severity": "warning",
                                "message": "Land area is unusually large, please verify",
                            })
                    except (ValueError, TypeError):
                        flags.append({
                            "field": field_name,
                            "severity": "error",
                            "message": "Could not parse land area value",
                        })

            if confidence < 0.5:
                flags.append({
                    "field": field_name,
                    "severity": "warning",
                    "message": f"Low confidence ({confidence:.0%}) for field '{field_name}'",
                })

        age_dob_consistency = self._check_age_dob_consistency(fields)
        if age_dob_consistency is not None:
            field_consistency["age_dob_match"] = age_dob_consistency
            if not age_dob_consistency:
                flags.append({
                    "field": "age",
                    "severity": "error",
                    "message": "Age does not match date of birth",
                })

        suspicious_patterns = self._check_suspicious_patterns(fields, document_type)
        flags.extend(suspicious_patterns)

        total_checks = len(field_consistency) if field_consistency else 1
        passed_checks = sum(1 for v in field_consistency.values() if v)
        validation_score = passed_checks / total_checks if field_consistency else 0.5

        has_critical = any(f.get("severity") == "error" for f in flags)
        is_valid = not has_critical

        return ValidationResult(
            is_valid=is_valid,
            score=validation_score,
            flags=flags,
            field_consistency=field_consistency,
        )

    def _check_age_dob_consistency(self, fields: Dict) -> Optional[bool]:
        from datetime import datetime

        age_value = None
        dob_value = None

        for key, val in fields.items():
            v = val if not isinstance(val, dict) else val.get("value", "")
            v_str = str(v).strip()

            if key in ("age", "आयु", "उम्र"):
                try:
                    age_value = int(v_str)
                except (ValueError, TypeError):
                    pass

            elif key in ("dob", "date_of_birth", "जन्म_तिथि", "जन्म तिथि"):
                dob_value = v_str

        if age_value is not None and dob_value:
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d %B %Y"):
                try:
                    dob_date = datetime.strptime(dob_value, fmt)
                    calculated_age = datetime.now().year - dob_date.year
                    if (datetime.now().month, datetime.now().day) < (dob_date.month, dob_date.day):
                        calculated_age -= 1
                    return abs(calculated_age - age_value) <= 2
                except (ValueError, TypeError):
                    continue

        return None

    def _check_suspicious_patterns(self, fields: Dict, document_type: str) -> List[Dict]:
        flags = []

        for field_name, field_info in fields.items():
            value = field_info if not isinstance(field_info, dict) else field_info.get("value", "")
            value_str = str(value).strip().lower()

            suspicious_keywords = ["template", "sample", "example", "demo", "test", "नमूना", "test"]
            for keyword in suspicious_keywords:
                if keyword in value_str:
                    flags.append({
                        "field": field_name,
                        "severity": "critical",
                        "message": f"Field contains suspicious keyword '{keyword}': '{value_str}'",
                    })
                    break

            repeated_chars = 0
            for i in range(2, 6):
                pattern = "0" * i + "0" * i
                if pattern in value_str:
                    repeated_chars = max(repeated_chars, i * 2)

            if repeated_chars > 3:
                flags.append({
                    "field": field_name,
                    "severity": "warning",
                    "message": f"Field contains suspicious repeated character pattern: '{value_str}'",
                })

        return flags
