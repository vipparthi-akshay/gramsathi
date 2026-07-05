from typing import Dict, List, Optional, Tuple

LANGUAGE_MAP: Dict[str, Dict] = {
    "hi": {
        "name": "Hindi",
        "google_speech_code": "hi-IN",
        "google_translate_code": "hi",
        "tts_voices": {"male": "hi-IN-Neural2-A", "female": "hi-IN-Neural2-C"},
        "script": "Devanagari",
        "family": "Indo-Aryan",
    },
    "bn": {
        "name": "Bengali",
        "google_speech_code": "bn-IN",
        "google_translate_code": "bn",
        "tts_voices": {"male": "bn-IN-Neural2-A", "female": "bn-IN-Neural2-B"},
        "script": "Bengali",
        "family": "Indo-Aryan",
    },
    "te": {
        "name": "Telugu",
        "google_speech_code": "te-IN",
        "google_translate_code": "te",
        "tts_voices": {"male": "te-IN-Neural2-A", "female": "te-IN-Neural2-B"},
        "script": "Telugu",
        "family": "Dravidian",
    },
    "mr": {
        "name": "Marathi",
        "google_speech_code": "mr-IN",
        "google_translate_code": "mr",
        "tts_voices": {"male": "mr-IN-Neural2-A", "female": "mr-IN-Neural2-B"},
        "script": "Devanagari",
        "family": "Indo-Aryan",
    },
    "ta": {
        "name": "Tamil",
        "google_speech_code": "ta-IN",
        "google_translate_code": "ta",
        "tts_voices": {"male": "ta-IN-Neural2-A", "female": "ta-IN-Neural2-B"},
        "script": "Tamil",
        "family": "Dravidian",
    },
    "gu": {
        "name": "Gujarati",
        "google_speech_code": "gu-IN",
        "google_translate_code": "gu",
        "tts_voices": {"male": "gu-IN-Neural2-A", "female": "gu-IN-Neural2-B"},
        "script": "Gujarati",
        "family": "Indo-Aryan",
    },
    "kn": {
        "name": "Kannada",
        "google_speech_code": "kn-IN",
        "google_translate_code": "kn",
        "tts_voices": {"male": "kn-IN-Neural2-A", "female": "kn-IN-Neural2-B"},
        "script": "Kannada",
        "family": "Dravidian",
    },
    "ml": {
        "name": "Malayalam",
        "google_speech_code": "ml-IN",
        "google_translate_code": "ml",
        "tts_voices": {"male": "ml-IN-Neural2-A", "female": "ml-IN-Neural2-B"},
        "script": "Malayalam",
        "family": "Dravidian",
    },
    "or": {
        "name": "Odia",
        "google_speech_code": "or-IN",
        "google_translate_code": "or",
        "tts_voices": {"male": "or-IN-Neural2-A", "female": "or-IN-Neural2-B"},
        "script": "Odia",
        "family": "Indo-Aryan",
    },
    "pa": {
        "name": "Punjabi",
        "google_speech_code": "pa-IN",
        "google_translate_code": "pa",
        "tts_voices": {"male": "pa-IN-Neural2-A", "female": "pa-IN-Neural2-B"},
        "script": "Gurmukhi",
        "family": "Indo-Aryan",
    },
    "as": {
        "name": "Assamese",
        "google_speech_code": "as-IN",
        "google_translate_code": "as",
        "tts_voices": {"male": "as-IN-Standard-A", "female": "as-IN-Standard-B"},
        "script": "Assamese",
        "family": "Indo-Aryan",
    },
    "mai": {
        "name": "Maithili",
        "google_speech_code": "mai-IN",
        "google_translate_code": "mai",
        "tts_voices": {"male": "mai-IN-Standard-A", "female": "mai-IN-Standard-A"},
        "script": "Devanagari",
        "family": "Indo-Aryan",
    },
    "sat": {
        "name": "Santali",
        "google_speech_code": "sat-IN",
        "google_translate_code": "sat",
        "tts_voices": {"male": "sat-IN-Standard-A", "female": "sat-IN-Standard-A"},
        "script": "Ol Chiki",
        "family": "Austroasiatic",
    },
    "ks": {
        "name": "Kashmiri",
        "google_speech_code": "ks-IN",
        "google_translate_code": "ks",
        "tts_voices": {"male": "ks-IN-Standard-A", "female": "ks-IN-Standard-A"},
        "script": "Perso-Arabic",
        "family": "Indo-Aryan",
    },
    "sd": {
        "name": "Sindhi",
        "google_speech_code": "sd-IN",
        "google_translate_code": "sd",
        "tts_voices": {"male": "sd-IN-Standard-A", "female": "sd-IN-Standard-A"},
        "script": "Perso-Arabic",
        "family": "Indo-Aryan",
    },
    "mni": {
        "name": "Manipuri",
        "google_speech_code": "mni-IN",
        "google_translate_code": "mni",
        "tts_voices": {"male": "mni-IN-Standard-A", "female": "mni-IN-Standard-A"},
        "script": "Meitei",
        "family": "Sino-Tibetan",
    },
    "ne": {
        "name": "Nepali",
        "google_speech_code": "ne-IN",
        "google_translate_code": "ne",
        "tts_voices": {"male": "ne-IN-Standard-A", "female": "ne-IN-Standard-A"},
        "script": "Devanagari",
        "family": "Indo-Aryan",
    },
    "en": {
        "name": "English",
        "google_speech_code": "en-IN",
        "google_translate_code": "en",
        "tts_voices": {"male": "en-IN-Neural2-A", "female": "en-IN-Neural2-C"},
        "script": "Latin",
        "family": "Germanic",
    },
    "ur": {
        "name": "Urdu",
        "google_speech_code": "ur-IN",
        "google_translate_code": "ur",
        "tts_voices": {"male": "ur-IN-Standard-A", "female": "ur-IN-Standard-A"},
        "script": "Perso-Arabic",
        "family": "Indo-Aryan",
    },
    "sa": {
        "name": "Sanskrit",
        "google_speech_code": "sa-IN",
        "google_translate_code": "sa",
        "tts_voices": {"male": "sa-IN-Standard-A", "female": "sa-IN-Standard-A"},
        "script": "Devanagari",
        "family": "Indo-Aryan",
    },
    "kok": {
        "name": "Konkani",
        "google_speech_code": "kok-IN",
        "google_translate_code": "kok",
        "tts_voices": {"male": "kok-IN-Standard-A", "female": "kok-IN-Standard-A"},
        "script": "Devanagari",
        "family": "Indo-Aryan",
    },
}

DIALECT_MAP: Dict[str, List[str]] = {
    "hi": ["awadhi", "braj", "bhojpuri", "magahi", "chhattisgarhi", "haryanvi", "marwari", "mewari", "bagheli", "bundeli"],
    "mr": ["varhadi", "konkani_mr"],
    "gu": ["kathiyawadi", "surati", "charotari"],
    "bn": ["banglali", "rahr", "varendri"],
    "ta": ["madurai", "coimbatore", "chennai"],
    "te": ["telangana", "andra"],
    "pa": ["majhi", "doabi", "malwai", "powadhi"],
    "as": ["kamrupi", "goalparia"],
}

SUPPORTED_LANGUAGES = sorted(LANGUAGE_MAP.keys())


def get_speech_recognition_config(language: str, dialect: Optional[str] = None) -> Dict:
    lang_code = normalize_language_code(language)
    config = LANGUAGE_MAP.get(lang_code, LANGUAGE_MAP["hi"])

    speech_config = {
        "language_code": config["google_speech_code"],
        "model": "latest_short",
        "use_enhanced": True,
        "enable_automatic_punctuation": True,
    }

    if dialect:
        speech_config["speech_contexts"] = [
            {
                "phrases": _get_dialect_phrases(dialect),
                "boost": 10.0,
            }
        ]

    return speech_config


def get_tts_voice(language: str, gender: str = "female") -> str:
    lang_code = normalize_language_code(language)
    config = LANGUAGE_MAP.get(lang_code, LANGUAGE_MAP["hi"])
    voice_key = "female" if gender == "female" else "male"
    return config["tts_voices"].get(voice_key, config["tts_voices"]["female"])


def normalize_language_code(code: str) -> str:
    if not code:
        return "hi"
    parts = code.split("-")
    base = parts[0].lower()
    if base in LANGUAGE_MAP:
        return base
    for lang_code, lang_info in LANGUAGE_MAP.items():
        if lang_info["google_speech_code"].startswith(code) or code.startswith(lang_code):
            return lang_code
    return "hi"


def _get_dialect_phrases(dialect: str) -> List[str]:
    dialect_phrases = {
        "awadhi": ["बाबू", "का हो", "अहै", "होइहै"],
        "bhojpuri": ["का हो", "बाबूजी", "हउवे", "कइलें"],
        "marwari": ["थारो", "म्हारो", "क्यूं", "होवे"],
        "haryanvi": ["तेरे", "मेरे", "क्युं", "होवे"],
    }
    return dialect_phrases.get(dialect.lower(), [])


def get_google_translate_target(language: str) -> str:
    lang_code = normalize_language_code(language)
    config = LANGUAGE_MAP.get(lang_code, LANGUAGE_MAP["hi"])
    return config["google_translate_code"]


def get_language_name(code: str) -> str:
    normalized = normalize_language_code(code)
    config = LANGUAGE_MAP.get(normalized)
    return config["name"] if config else "Unknown"


def is_right_to_left(language: str) -> bool:
    rtl_languages = {"ur", "ks", "sd", "fa", "ar"}
    return normalize_language_code(language) in rtl_languages
