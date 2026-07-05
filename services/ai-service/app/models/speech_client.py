import base64
import io
from dataclasses import dataclass
from typing import Dict, List, Optional

from google.cloud import speech, texttospeech

from app.config import settings


@dataclass
class TranscriptResult:
    transcript: str
    confidence: float
    language: str
    dialect: Optional[str] = None
    words: Optional[List[Dict]] = None


@dataclass
class AudioResponse:
    audio_bytes: bytes
    encoding: str = "WAV"
    sample_rate: int = 24000


INDIAN_LANGUAGE_CONFIG: Dict[str, Dict] = {
    "hi": {"code": "hi-IN", "model": "latest_short", "tts_name": "hi-IN-Neural2-A", "tts_name_female": "hi-IN-Neural2-C"},
    "bn": {"code": "bn-IN", "model": "latest_short", "tts_name": "bn-IN-Neural2-A", "tts_name_female": "bn-IN-Neural2-B"},
    "te": {"code": "te-IN", "model": "latest_short", "tts_name": "te-IN-Neural2-A", "tts_name_female": "te-IN-Neural2-B"},
    "mr": {"code": "mr-IN", "model": "latest_short", "tts_name": "mr-IN-Neural2-A", "tts_name_female": "mr-IN-Neural2-B"},
    "ta": {"code": "ta-IN", "model": "latest_short", "tts_name": "ta-IN-Neural2-A", "tts_name_female": "ta-IN-Neural2-B"},
    "gu": {"code": "gu-IN", "model": "latest_short", "tts_name": "gu-IN-Neural2-A", "tts_name_female": "gu-IN-Neural2-B"},
    "kn": {"code": "kn-IN", "model": "latest_short", "tts_name": "kn-IN-Neural2-A", "tts_name_female": "kn-IN-Neural2-B"},
    "ml": {"code": "ml-IN", "model": "latest_short", "tts_name": "ml-IN-Neural2-A", "tts_name_female": "ml-IN-Neural2-B"},
    "or": {"code": "or-IN", "model": "latest_short", "tts_name": "or-IN-Neural2-A", "tts_name_female": "or-IN-Neural2-B"},
    "pa": {"code": "pa-IN", "model": "latest_short", "tts_name": "pa-IN-Neural2-A", "tts_name_female": "pa-IN-Neural2-B"},
    "as": {"code": "as-IN", "model": "latest_short", "tts_name": "as-IN-Standard-A", "tts_name_female": "as-IN-Standard-B"},
    "mai": {"code": "mai-IN", "model": "latest_short", "tts_name": "mai-IN-Standard-A", "tts_name_female": "mai-IN-Standard-B"},
    "sat": {"code": "sat-IN", "model": "latest_short", "tts_name": "sat-IN-Standard-A", "tts_name_female": "sat-IN-Standard-A"},
    "ks": {"code": "ks-IN", "model": "latest_short", "tts_name": "ks-IN-Standard-A", "tts_name_female": "ks-IN-Standard-A"},
    "sd": {"code": "sd-IN", "model": "latest_short", "tts_name": "sd-IN-Standard-A", "tts_name_female": "sd-IN-Standard-A"},
    "mni": {"code": "mni-IN", "model": "latest_short", "tts_name": "mni-IN-Standard-A", "tts_name_female": "mni-IN-Standard-A"},
    "ne": {"code": "ne-IN", "model": "latest_short", "tts_name": "ne-IN-Standard-A", "tts_name_female": "ne-IN-Standard-A"},
    "si": {"code": "si-IN", "model": "latest_short", "tts_name": "si-IN-Standard-A", "tts_name_female": "si-IN-Standard-A"},
    "ur": {"code": "ur-IN", "model": "latest_short", "tts_name": "ur-IN-Standard-A", "tts_name_female": "ur-IN-Standard-A"},
    "en": {"code": "en-IN", "model": "latest_short", "tts_name": "en-IN-Neural2-A", "tts_name_female": "en-IN-Neural2-C"},
    "sa": {"code": "sa-IN", "model": "latest_short", "tts_name": "sa-IN-Standard-A", "tts_name_female": "sa-IN-Standard-A"},
    "kok": {"code": "kok-IN", "model": "latest_short", "tts_name": "kok-IN-Standard-A", "tts_name_female": "kok-IN-Standard-A"},
}


class SpeechClient:
    def __init__(self):
        self._speech_client: Optional[speech.SpeechClient] = None
        self._tts_client: Optional[texttospeech.TextToSpeechClient] = None

    @property
    def speech_client(self) -> speech.SpeechClient:
        if self._speech_client is None:
            self._speech_client = speech.SpeechClient()
        return self._speech_client

    @property
    def tts_client(self) -> texttospeech.TextToSpeechClient:
        if self._tts_client is None:
            self._tts_client = texttospeech.TextToSpeechClient()
        return self._tts_client

    def _get_lang_config(self, language: str) -> Dict:
        lang = language.split("-")[0] if "-" in language else language
        config = INDIAN_LANGUAGE_CONFIG.get(lang)
        if config is None:
            config = INDIAN_LANGUAGE_CONFIG["hi"]
        return config

    def transcribe_audio(
        self,
        audio_bytes: bytes,
        language: str = "hi",
        dialect: Optional[str] = None,
        encoding: str = "LINEAR16",
        sample_rate: int = 16000,
    ) -> TranscriptResult:
        lang_config = self._get_lang_config(language)
        encoding_map = {
            "LINEAR16": speech.RecognitionConfig.AudioEncoding.LINEAR16,
            "MULAW": speech.RecognitionConfig.AudioEncoding.MULAW,
            "FLAC": speech.RecognitionConfig.AudioEncoding.FLAC,
        }

        audio = speech.RecognitionAudio(content=audio_bytes)
        config = speech.RecognitionConfig(
            encoding=encoding_map.get(encoding, speech.RecognitionConfig.AudioEncoding.LINEAR16),
            sample_rate_hertz=sample_rate,
            language_code=lang_config["code"],
            model=lang_config["model"],
            enable_automatic_punctuation=True,
            enable_word_time_offsets=True,
            use_enhanced=True,
            alternative_language_codes=[],
        )

        response = self.speech_client.recognize(config=config, audio=audio)

        if not response.results:
            return TranscriptResult(
                transcript="",
                confidence=0.0,
                language=language,
                dialect=dialect,
                words=[],
            )

        best_result = response.results[0]
        best_alternative = best_result.alternatives[0]
        words_list = [
            {
                "word": w.word,
                "start_time": w.start_time.total_seconds() if w.start_time else 0,
                "end_time": w.end_time.total_seconds() if w.end_time else 0,
                "confidence": w.confidence if w.confidence else 0.0,
            }
            for w in best_alternative.words
        ] if best_alternative.words else []

        detected_language = language
        if best_result.language_code:
            detected_language = best_result.language_code.split("-")[0]

        return TranscriptResult(
            transcript=best_alternative.transcript,
            confidence=best_alternative.confidence if best_alternative.confidence else 0.0,
            language=detected_language,
            dialect=dialect,
            words=words_list,
        )

    def synthesize_speech(
        self,
        text: str,
        language: str = "hi",
        gender_preference: str = "female",
    ) -> AudioResponse:
        lang_config = self._get_lang_config(language)
        voice_name = (
            lang_config["tts_name_female"] if gender_preference == "female"
            else lang_config["tts_name"]
        )

        ssml_text = f"<speak>{text}</speak>"

        synthesis_input = texttospeech.SynthesisInput(ssml=ssml_text)
        voice = texttospeech.VoiceSelectionParams(
            name=voice_name,
            language_code=lang_config["code"],
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL,
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.LINEAR16,
            speaking_rate=0.95,
            pitch=0.0,
            sample_rate_hertz=24000,
        )

        response = self.tts_client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config,
        )

        return AudioResponse(
            audio_bytes=response.audio_content,
            encoding="WAV",
            sample_rate=24000,
        )

    def detect_language_from_audio(self, audio_bytes: bytes) -> Dict:
        audio = speech.RecognitionAudio(content=audio_bytes)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="hi-IN",
            model="latest_short",
            enable_automatic_punctuation=True,
            alternative_language_codes=[
                "bn-IN", "te-IN", "mr-IN", "ta-IN", "gu-IN",
                "kn-IN", "ml-IN", "or-IN", "pa-IN", "as-IN",
                "en-IN", "ur-IN",
            ],
        )

        response = self.speech_client.recognize(config=config, audio=audio)

        if not response.results:
            return {"language": "unknown", "confidence": 0.0}

        best_result = response.results[0]
        lang_code = best_result.language_code or "hi-IN"
        confidence = best_result.alternatives[0].confidence if best_result.alternatives else 0.0

        lang_map = {
            "hi-IN": ("hi", "Hindi"),
            "bn-IN": ("bn", "Bengali"),
            "te-IN": ("te", "Telugu"),
            "mr-IN": ("mr", "Marathi"),
            "ta-IN": ("ta", "Tamil"),
            "gu-IN": ("gu", "Gujarati"),
            "kn-IN": ("kn", "Kannada"),
            "ml-IN": ("ml", "Malayalam"),
            "or-IN": ("or", "Odia"),
            "pa-IN": ("pa", "Punjabi"),
            "as-IN": ("as", "Assamese"),
            "en-IN": ("en", "English"),
            "ur-IN": ("ur", "Urdu"),
        }

        code, name = lang_map.get(lang_code, (lang_code.split("-")[0], lang_code))

        return {
            "language": code,
            "language_name": name,
            "confidence": confidence,
        }
