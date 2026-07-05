import json
import re
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from app.models.gemini_client import GeminiClient


@dataclass
class IntentResult:
    intent: str
    confidence: float
    entities: Dict[str, Any] = field(default_factory=dict)
    suggested_handler: Optional[str] = None


INTENTS = {
    "scheme_discovery": {
        "keywords": ["scheme", "yojana", "benefit", "subsidy", "welfare", "help", "assistance",
                     "sarkari", "sahayata", "pension", "scholarship", "loan", "free",
                     "योजना", "स्कीम", "सहायता", "लाभ", "पेंशन", "छात्रवृत्ति"],
        "patterns": [
            r"(kaun|which|what|kya|list).*(scheme|yojana|benefit)",
            r"(eligible|pata|qualify|milna|apply).*(scheme|yojana)",
            r"(mujhe|i need|i want|main).*(help|assistance|sahayata)",
        ],
    },
    "application_help": {
        "keywords": ["apply", "form", "application", "register", "submit", "how to",
                     "aavedan", "form", "apply", "karna hai", "process", "documents",
                     "आवेदन", "फॉर्म", "कैसे करें", "दस्तावेज़"],
        "patterns": [
            r"(how|kaise|apply|karna).*(apply|form|application|register)",
            r"(documents|dastawez|papers|docs).*(required|chahiye|needed)",
            r"(application|form).*(kaise|how|status|track)",
        ],
    },
    "complaint": {
        "keywords": ["complaint", "shikayat", "problem", "issue", "grievance", "not working",
                     "lagataar", "nhi ho raha", "delay", "corruption", "bribe",
                     "शिकायत", "समस्या", "शिकायत", "दिक्कत", "भ्रष्टाचार"],
        "patterns": [
            r"(complaint|shikayat|grievance).*(karna|file|register|draft)",
            r"(work|kaam).*nhi.*(ho|karna)",
            r"(delay|lambi|late|der).*(ho|hai)",
        ],
    },
    "status_check": {
        "keywords": ["status", "track", "update", "progress", "kahan", "check",
                     "application status", "form status", "pending",
                     "स्थिति", "स्टेटस", "ट्रैक", "चेक"],
        "patterns": [
            r"(status|track|update).*(application|form|scheme|yojana)",
            r"(mera|my).*(application|form).*(status|kya|kaise)",
            r"(kahan|where).*(application|form).*(hai|pahuncha|reached)",
        ],
    },
    "document_help": {
        "keywords": ["document", "certificate", "aadhaar", "pan", "voter", "id card",
                     "income certificate", "caste", "domicile", "birth certificate",
                     "दस्तावेज़", "प्रमाण पत्र", "आधार", "पैन"],
        "patterns": [
            r"(document|certificate|praman|card).*(kaise|how|banwa|apply)",
            r"(aadhaar|pan|voter).*(correct|update|change|error)",
            r"(lost|kho|gum|lost).*(document|certificate|card)",
        ],
    },
    "eligibility_check": {
        "keywords": ["eligible", "pata", "kya main", "qualify", "mil sakta", "am i",
                     "पात्र", "योग्य", "क्या मैं", "मिल सकता"],
        "patterns": [
            r"(kya main|am i|can i).*(eligible|pata|apply|get)",
            r"(eligible|pata).*(hoon|hun|hai|kya)",
            r"(qualify|qualifies|milta|milega)",
        ],
    },
    "general_query": {
        "keywords": ["help", "question", "info", "information", "tell", "what is",
                     "kya hai", "meaning", "matlab", "samananya"],
        "patterns": [],
    },
}


class IntentClassifier:
    def __init__(self):
        self.gemini = GeminiClient()

    def classify_intent(self, message: str, language: str = "hi") -> IntentResult:
        gemini_result = self._classify_with_gemini(message, language)

        if gemini_result and gemini_result.confidence > 0.7:
            return gemini_result

        keyword_result = self._classify_with_keywords(message)
        if keyword_result and keyword_result.confidence > 0.5:
            if gemini_result and gemini_result.confidence > keyword_result.confidence:
                return gemini_result
            return keyword_result

        return gemini_result or IntentResult(
            intent="general_query",
            confidence=0.5,
            entities={},
            suggested_handler="general_query",
        )

    def _classify_with_gemini(self, message: str, language: str) -> Optional[IntentResult]:
        prompt = (
            f"Analyze the following user message and classify its intent. "
            f"Consider the language: {language}\n\n"
            f"Message: {message}\n\n"
            f"Possible intents: scheme_discovery, application_help, complaint, "
            f"status_check, document_help, eligibility_check, general_query\n\n"
            f"Return ONLY a JSON object with:\n"
            f"- 'intent': one of the above intents\n"
            f"- 'confidence': float between 0 and 1\n"
            f"- 'entities': object with extracted entities like "
            f"scheme_name, document_type, action, department, time_reference\n"
            f"- 'suggested_handler': the intent itself or a more specific handler name\n"
        )

        try:
            result_text = self.gemini.flash_model.generate_content(
                prompt,
                generation_config=type(
                    "Config",
                    (),
                    {"temperature": 0.0, "max_output_tokens": 512},
                )(),
            )
            text = result_text.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]

            data = json.loads(text.strip())
            return IntentResult(
                intent=data.get("intent", "general_query"),
                confidence=float(data.get("confidence", 0.5)),
                entities=data.get("entities", {}),
                suggested_handler=data.get("suggested_handler", data.get("intent", "general_query")),
            )
        except Exception:
            return None

    def _classify_with_keywords(self, message: str) -> Optional[IntentResult]:
        message_lower = message.lower()

        scores = {}
        for intent_name, intent_config in INTENTS.items():
            score = 0.0
            keyword_matches = sum(
                1 for kw in intent_config["keywords"]
                if kw.lower() in message_lower
            )
            if keyword_matches > 0:
                score += keyword_matches * 0.15

            for pattern in intent_config.get("patterns", []):
                if re.search(pattern, message_lower, re.IGNORECASE):
                    score += 0.3

            if score > 0:
                scores[intent_name] = min(score, 1.0)

        if not scores:
            return None

        best_intent = max(scores, key=scores.get)
        entities = self._extract_entities(message)

        return IntentResult(
            intent=best_intent,
            confidence=scores[best_intent],
            entities=entities,
            suggested_handler=best_intent,
        )

    def _extract_entities(self, message: str) -> Dict[str, Any]:
        entities = {}

        scheme_patterns = [
            r"(?:pension|पेंशन)",
            r"(?:kisan|किसान).*(?:samman|सम्मान)",
            r"(?:pm|प्रधानमंत्री).*(?:kisan|किसान)",
            r"(?:ayushman|आयुष्मान)",
            r"(?:sukanya|सुकन्या).*(?:samriddhi|समृद्धि)",
            r"(?:ujjwala|उज्ज्वला)",
            r"(?:jal|जल).*(?:jeevan|जीवन)",
            r"(?:shramik|श्रमिक)",
            r"(?:aawas|आवास).*(?:yojana|योजना)",
            r"(?:election|चुनाव).*(?:card|कार्ड|id)",
            r"(?:voter|मतदाता).*(?:id|कार्ड)",
            r"(?:ration|राशन).*(?:card|कार्ड)",
        ]
        for pattern in scheme_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                entities["scheme_name"] = match.group(0)
                break

        doc_patterns = [
            r"(?:aadhaar|आधार).*(?:card|कार्ड)?",
            r"(?:pan|पैन).*(?:card|कार्ड)?",
            r"(?:income|आय).*(?:certificate|प्रमाण पत्र)?",
            r"(?:caste|जाति).*(?:certificate|प्रमाण पत्र)?",
            r"(?:domicile|स्थानीय).*(?:certificate|प्रमाण पत्र)?",
            r"(?:birth|जन्म).*(?:certificate|प्रमाण पत्र)?",
            r"(?:voter|मतदाता).*(?:id|कार्ड)?",
            r"(?:ration|राशन).*(?:card|कार्ड)?",
            r"(?:passbook|पासबुक)",
            r"(?:land|भूमि).*(?:record|रिकॉर्ड)?",
        ]
        for pattern in doc_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                entities["document_type"] = match.group(0)
                break

        dept_map = {
            r"(?:pension|पेंशन|social justice|समाज कल्याण)": "social_justice",
            r"(?:agriculture|कृषि|kisan|किसान)": "agriculture",
            r"(?:health|स्वास्थ्य|ayushman|आयुष्मान)": "health",
            r"(?:education|शिक्षा|school|स्कूल)": "education",
            r"(?:water|जल|pani|पानी)": "water_supply",
            r"(?:road|सड़क)": "road_transport",
            r"(?:electricity|बिजली|bijli|बिजली)": "electricity",
            r"(?:housing|आवास|makan|मकान)": "housing",
        }
        for pattern, dept in dept_map.items():
            if re.search(pattern, message, re.IGNORECASE):
                entities["department"] = dept
                break

        time_patterns = [
            r"(\d+)\s*(?:days|दिन|hours|घंटे|weeks|हफ्ते|months|महीने)\s*(?:se|से|ago|पहले)",
            r"(?:aaj|आज|today|kal|कल|kal subah|कल सुबह|aaj subah|आज सुबह)",
        ]
        for pattern in time_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                entities["time_reference"] = match.group(0)
                break

        action_patterns = [
            r"(?:apply|आवेदन|register|पंजीकरण|submit|जमा)",
            r"(?:track|ट्रैक|status|स्थिति|check|चेक)",
            r"(?:update|अपडेट|correct|सही|change|बदल)",
            r"(?:complaint|शिकायत|file|दर्ज)",
            r"(?:know|जान|tell|बताओ|information|जानकारी)",
        ]
        for pattern in action_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                entities["action"] = match.group(0)
                break

        return entities
