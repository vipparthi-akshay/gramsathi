import base64
import json
import logging


from fastapi import APIRouter, Depends, HTTPException

from app.models.gemini_client import GeminiClient
from app.models.vision_client import VisionClient
from app.schemas.ocr import (
    OCRAnalyzeRequest,
    OCRAnalyzeResponse,
    OCRField,
    OCRFlag,
    OCRProcessRequest,
    OCRProcessResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/ocr")


def get_vision_client() -> VisionClient:
    return VisionClient()


def get_gemini_client() -> GeminiClient:
    return GeminiClient()


@router.post("/api/v1/ai/ocr/process", response_model=OCRProcessResponse)
async def process_document(
    request: OCRProcessRequest,
    vision: VisionClient = Depends(get_vision_client),
):
    try:
        image_bytes = base64.b64decode(request.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    try:
        analysis = vision.analyze_document_image(
            image_bytes=image_bytes,
            document_type=request.document_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {e}")

    validation = vision.validate_extracted_data(
        extracted_data={"extracted_fields": analysis.extracted_fields},
        document_type=request.document_type,
    )

    extracted_fields = {}
    for field_name, field_data in analysis.extracted_fields.items():
        field_value = field_data if not isinstance(field_data, dict) else field_data.get("value", "")
        field_confidence = (
            field_data.get("confidence", analysis.confidence)
            if isinstance(field_data, dict) else analysis.confidence
        )
        is_valid = True

        for flag in validation.flags:
            if flag.get("field") == field_name:
                is_valid = False
                break

        extracted_fields[field_name] = OCRField(
            name=field_name,
            value=field_value,
            confidence=field_confidence,
            is_valid=is_valid,
        )

    flags = [
        OCRFlag(
            field=f.get("field", "unknown"),
            severity=f.get("severity", "warning"),
            message=f.get("message", ""),
        )
        for f in validation.flags
    ]

    needs_review = not validation.is_valid or any(
        f.get("severity") in ("error", "critical") for f in validation.flags
    )

    return OCRProcessResponse(
        document_type=request.document_type,
        extracted_fields=extracted_fields,
        overall_confidence=analysis.confidence,
        needs_review=needs_review,
        flags=flags,
    )


@router.post("/api/v1/ai/ocr/analyze", response_model=OCRAnalyzeResponse)
async def analyze_document(
    request: OCRAnalyzeRequest,
    gemini: GeminiClient = Depends(get_gemini_client),
    vision: VisionClient = Depends(get_vision_client),
):
    extracted_data = request.ocr_data.get("extracted_fields", request.ocr_data)

    validation = vision.validate_extracted_data(
        extracted_data={"extracted_fields": extracted_data},
        document_type=request.document_type,
    )

    prompt = (
        f"Analyze the following OCR-extracted data from a {request.document_type} document.\n\n"
        f"### Purpose of analysis\n{request.purpose}\n\n"
        f"### OCR Data\n{json.dumps(extracted_data, ensure_ascii=False, indent=2)}\n\n"
        "### Validation Flags\n"
        f"{json.dumps(validation.flags, ensure_ascii=False, indent=2) if validation.flags else 'No validation flags'}"
        "\n\n"
        "Please provide:\n"
        "1. A detailed analysis of the document contents\n"
        "2. Any inconsistencies or suspicious patterns found\n"
        "3. Suggestions for the citizen regarding this document\n"
        "4. Overall confidence assessment\n\n"
        "Return your analysis as a JSON object with:\n"
        "- 'analysis': detailed text analysis\n"
        "- 'flags': list of flags found (field, severity, message)\n"
        "- 'suggestions': list of actionable suggestions\n"
        "- 'overall_confidence': float 0.0-1.0"
    )

    result_text = gemini.generate_response(
        prompt=prompt,
        language="en",
        temperature=0.1,
    )

    try:
        cleaned = result_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        result = json.loads(cleaned.strip())
    except (json.JSONDecodeError, Exception):
        result = {
            "analysis": result_text,
            "flags": [f.message for f in validation.flags],
            "suggestions": ["Review the document manually"],
            "overall_confidence": validation.score,
        }

    flags = [
        OCRFlag(
            field=f.get("field", "unknown"),
            severity=f.get("severity", "warning"),
            message=f.get("message", str(f)),
        )
        for f in result.get("flags", [])
    ]

    existing_flag_fields = {f.field for f in flags}
    for vf in validation.flags:
        if vf.get("field") not in existing_flag_fields:
            flags.append(
                OCRFlag(
                    field=vf.get("field", "unknown"),
                    severity=vf.get("severity", "warning"),
                    message=vf.get("message", ""),
                )
            )

    return OCRAnalyzeResponse(
        analysis=result.get("analysis", result_text),
        flags=flags,
        suggestions=result.get("suggestions", []),
        overall_confidence=result.get("overall_confidence", validation.score),
    )
