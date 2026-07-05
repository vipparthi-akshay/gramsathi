import logging
from typing import Optional

from fastapi import APIRouter, Depends
from google.cloud import translate

from app.config import settings
from app.models.gemini_client import GeminiClient
from app.schemas.translate import (
    DetectRequest,
    DetectResponse,
    TranslateRequest,
    TranslateResponse,
)
from app.utils.language_utils import (
    get_language_name,
    normalize_language_code,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/translate")


def get_gemini_client() -> GeminiClient:
    return GeminiClient()


def get_translate_client() -> Optional[translate.TranslationServiceClient]:
    if settings.GOOGLE_CLOUD_PROJECT:
        try:
            return translate.TranslationServiceClient()
        except Exception as e:
            logger.warning(f"Failed to initialize Google Translate client: {e}")
    return None


@router.post("/api/v1/ai/translate", response_model=TranslateResponse)
async def translate_text(
    request: TranslateRequest,
    gemini: GeminiClient = Depends(get_gemini_client),
):
    translated_text = None
    confidence = 0.95

    translate_client = get_translate_client()
    if translate_client:
        try:
            source_lang = request.source_language or "en"
            target_lang = request.target_language

            response = translate_client.translate_text(
                parent=f"projects/{settings.GOOGLE_CLOUD_PROJECT}",
                contents=[request.text],
                source_language_code=source_lang,
                target_language_code=target_lang,
                mime_type="text/plain",
            )

            if response.translations:
                translated_text = response.translations[0].translated_text
                translations = response.translations[0]
                if hasattr(translations, 'glossary_translations') and translations.glossary_translations:
                    translated_text = translations.glossary_translations[0].translated_text
        except Exception as e:
            logger.warning(f"Google Translate API failed, falling back to Gemini: {e}")

    if not translated_text:
        translated_text = gemini.translate_text(
            text=request.text,
            target_language=request.target_language,
            source_language=request.source_language,
        )
        confidence = 0.85

    detected_source = request.source_language
    if not detected_source:
        try:
            detection = gemini.detect_language(request.text)
            detected_source = detection.get("language_code", "unknown")
        except Exception:
            detected_source = "en"

    target_name = get_language_name(request.target_language)

    return TranslateResponse(
        translated_text=translated_text,
        source_language=detected_source,
        target_language=target_name,
        confidence=confidence,
    )


@router.post("/api/v1/ai/translate/detect", response_model=DetectResponse)
async def detect_language(
    request: DetectRequest,
    gemini: GeminiClient = Depends(get_gemini_client),
):
    result = None

    translate_client = get_translate_client()
    if translate_client:
        try:
            response = translate_client.detect_language(
                parent=f"projects/{settings.GOOGLE_CLOUD_PROJECT}",
                contents=[request.text],
            )
            if response.languages:
                detection = response.languages[0]
                result = {
                    "language": detection.language_code or "unknown",
                    "confidence": (
                        detection.confidence
                        if hasattr(detection, 'confidence') and detection.confidence
                        else 0.95
                    ),
                    "dialect": None,
                }
        except Exception as e:
            logger.warning(f"Google Translate detection failed, falling back to Gemini: {e}")

    if not result:
        gemini_detection = gemini.detect_language(request.text)
        result = {
            "language": gemini_detection.get("language_code", "unknown"),
            "confidence": gemini_detection.get("confidence", 0.7),
            "dialect": None,
        }

    lang_code = normalize_language_code(result["language"])
    language_name = get_language_name(lang_code)

    return DetectResponse(
        language=language_name,
        confidence=result["confidence"],
        dialect=result.get("dialect"),
    )
