import json
from typing import Any, AsyncGenerator, Dict, Generator, List, Optional

import google.generativeai as genai
from google.generativeai import GenerativeModel
from google.generativeai.types import GenerationConfig, HarmCategory, HarmBlockThreshold

from app.config import settings


class GeminiClient:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = GenerativeModel(settings.GEMINI_MODEL)
        self.flash_model = GenerativeModel(settings.GEMINI_FLASH_MODEL)

    def _build_language_instruction(self, language: str, dialect: Optional[str] = None) -> str:
        instruction = f"Respond in the language: {language}"
        if dialect:
            instruction += f". Use the dialect: {dialect}"
        instruction += ". If the language is one of the Indian regional languages, respond primarily in that language while keeping key terms in English where appropriate."
        return instruction

    def generate_response(
        self,
        prompt: str,
        language: str = "hi",
        dialect: Optional[str] = None,
        temperature: float = 0.3,
    ) -> str:
        lang_instruction = self._build_language_instruction(language, dialect)
        full_prompt = f"{lang_instruction}\n\n{prompt}"

        try:
            response = self.model.generate_content(
                full_prompt,
                generation_config=GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=2048,
                ),
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
            )
            return response.text
        except Exception as e:
            raise RuntimeError(f"Gemini generation failed: {e}")

    async def chat_stream(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        language: str = "hi",
    ) -> AsyncGenerator[str, None]:
        lang_instruction = self._build_language_instruction(language)
        chat = self.model.start_chat(history=history or [])

        try:
            response = chat.send_message(
                f"{lang_instruction}\n\n{prompt}",
                stream=True,
                generation_config=GenerationConfig(temperature=0.3, max_output_tokens=2048),
            )
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"Error: {e}"

    def analyze_document(self, image_bytes: bytes, document_type: str = "general") -> Dict[str, Any]:
        prompt_map = {
            "aadhaar": (
                "Extract the following fields from this Aadhaar card image. Return ONLY a JSON object "
                "with these keys: aadhaar_number, name, dob, gender, address, phone. "
                "Set confidence scores for each field."
            ),
            "income_certificate": (
                "Extract the following fields from this income certificate image. Return ONLY a JSON object "
                "with these keys: certificate_number, holder_name, annual_income, issue_date, issuing_authority, valid_until."
            ),
            "land_record": (
                "Extract the following fields from this land record document image. Return ONLY a JSON object "
                "with these keys: khata_number, plot_number, village, area_acres, owner_name, land_type, survey_number."
            ),
            "bank_passbook": (
                "Extract the following fields from this bank passbook image. Return ONLY a JSON object "
                "with these keys: account_number, holder_name, bank_name, branch, ifsc_code, account_type, balance."
            ),
            "general": (
                "Extract all visible text and structured fields from this document image. "
                "Return a JSON object with a 'raw_text' field containing all extracted text "
                "and an 'extracted_fields' object with key-value pairs for any identified fields."
            ),
        }
        prompt = prompt_map.get(document_type, prompt_map["general"])

        try:
            image_part = {"mime_type": "image/jpeg", "data": image_bytes}
            response = self.model.generate_content(
                [prompt, image_part],
                generation_config=GenerationConfig(temperature=0.1, max_output_tokens=4096),
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())
        except json.JSONDecodeError:
            return {"raw_text": text if 'text' in locals() else "", "error": "Failed to parse structured JSON"}
        except Exception as e:
            raise RuntimeError(f"Document analysis failed: {e}")

    def translate_text(
        self,
        text: str,
        target_language: str,
        source_language: Optional[str] = None,
    ) -> str:
        source = f" from {source_language}" if source_language else ""
        prompt = (
            f"Translate the following text{source} to {target_language}. "
            f"Return ONLY the translated text without any additional commentary.\n\n{text}"
        )
        try:
            response = self.flash_model.generate_content(
                prompt,
                generation_config=GenerationConfig(temperature=0.0, max_output_tokens=2048),
            )
            return response.text.strip()
        except Exception as e:
            raise RuntimeError(f"Translation failed: {e}")

    def detect_language(self, text: str) -> Dict[str, Any]:
        prompt = (
            "Detect the language of the following text. Return ONLY a JSON object "
            "with keys 'language' (full name), 'language_code' (ISO 639-1 code), "
            "and 'confidence' (float between 0 and 1).\n\n"
            f"Text: {text}"
        )
        try:
            response = self.flash_model.generate_content(
                prompt,
                generation_config=GenerationConfig(temperature=0.0, max_output_tokens=256),
            )
            resp_text = response.text.strip()
            if resp_text.startswith("```json"):
                resp_text = resp_text[7:]
            if resp_text.endswith("```"):
                resp_text = resp_text[:-3]
            return json.loads(resp_text.strip())
        except (json.JSONDecodeError, Exception):
            return {"language": "unknown", "language_code": "unknown", "confidence": 0.0}

    def summarize_conversation(self, messages: List[Dict[str, str]]) -> str:
        conversation_text = "\n".join(
            f"{msg.get('role', 'unknown')}: {msg.get('content', '')}" for msg in messages
        )
        prompt = (
            "Summarize the following conversation in 2-3 sentences. "
            "Focus on key topics, user intent, decisions made, and any action items.\n\n"
            f"{conversation_text}"
        )
        try:
            response = self.flash_model.generate_content(
                prompt,
                generation_config=GenerationConfig(temperature=0.2, max_output_tokens=512),
            )
            return response.text.strip()
        except Exception as e:
            raise RuntimeError(f"Summarization failed: {e}")

    def rank_schemes_by_relevance(
        self,
        citizen_profile: Dict[str, Any],
        schemes: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        profile_str = json.dumps(citizen_profile, ensure_ascii=False, indent=2)
        schemes_str = json.dumps(schemes, ensure_ascii=False, indent=2)
        prompt = (
            f"Given the following citizen profile:\n{profile_str}\n\n"
            f"And the following government schemes:\n{schemes_str}\n\n"
            "Rank these schemes by relevance to the citizen. Return ONLY a JSON array "
            "where each element has 'scheme_id', 'scheme_name', 'relevance_score' (0-100), "
            "'relevance_reason', 'estimated_benefit', and 'eligibility_status' (eligible/partial/ineligible)."
        )
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=GenerationConfig(temperature=0.2, max_output_tokens=4096),
            )
            resp_text = response.text.strip()
            if resp_text.startswith("```json"):
                resp_text = resp_text[7:]
            if resp_text.endswith("```"):
                resp_text = resp_text[:-3]
            ranked = json.loads(resp_text.strip())
            ranked.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
            return ranked
        except json.JSONDecodeError:
            return schemes
        except Exception as e:
            raise RuntimeError(f"Scheme ranking failed: {e}")
