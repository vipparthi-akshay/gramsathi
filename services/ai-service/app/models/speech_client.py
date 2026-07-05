from dataclasses import dataclass
from typing import Dict, List, Optional

from google.cloud import speech, texttospeech


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


def _lang_entry(code: str, tts: str, tts_f: str) -> Dict:
    return {"code": code, "model": "latest_short", "tts_name": tts, "tts_name_female": tts_f}


INDIAN_LANGUAGE_CONFIG: Dict[str, Dict] = {
    "hi": _lang_entry("hi-IN", "hi-IN-Neural2-A", "hi-IN-Neural2-C"),
    "bn": _lang_entry("bn-IN", "bn-IN-Neural2-A", "bn-IN-Neural2-B"),
    "te": _lang_entry("te-IN", "te-IN-Neural2-A", "te-IN-Neural2-B"),
    "mr": _lang_entry("mr-IN", "mr-IN-Neural2-A", "mr-IN-Neural2-B"),
    "ta": _lang_entry("ta-IN", "ta-IN-Neural2-A", "ta-IN-Neural2-B"),
    "gu": _lang_entry("gu-IN", "gu-IN-Neural2-A", "gu-IN-Neural2-B"),
    "kn": _lang_entry("kn-IN", "kn-IN-Neural2-A", "kn-IN-Neural2-B"),
    "ml": _lang_entry("ml-IN", "ml-IN-Neural2-A", "ml-IN-Neural2-B"),
    "or": _lang_entry("or-IN", "or-IN-Neural2-A", "or-IN-Neural2-B"),
    "pa": _lang_entry("pa-IN", "pa-IN-Neural2-A", "pa-IN-Neural2-B"),
    "as": _lang_entry("as-IN", "as-IN-Standard-A", "as-IN-Standard-B"),
    "mai": _lang_entry("mai-IN", "mai-IN-Standard-A", "mai-IN-Standard-B"),
    "sat": _lang_entry("sat-IN", "sat-IN-Standard-A", "sat-IN-Standard-A"),
    "ks": _lang_entry("ks-IN", "ks-IN-Standard-A", "ks-IN-Standard-A"),
    "sd": _lang_entry("sd-IN", "sd-IN-Standard-A", "sd-IN-Standard-A"),
    "mni": _lang_entry("mni-IN", "mni-IN-Standard-A", "mni-IN-Standard-A"),
    "ne": _lang_entry("ne-IN", "ne-IN-Standard-A", "ne-IN-Standard-A"),
    "si": _lang_entry("si-IN", "si-IN-Standard-A", "si-IN-Standard-A"),
    "ur": _lang_entry("ur-IN", "ur-IN-Standard-A", "ur-IN-Standard-A"),
    "en": _lang_entry("en-IN", "en-IN-Neural2-A", "en-IN-Neural2-C"),
    "sa": _lang_entry("sa-IN", "sa-IN-Standard-A", "sa-IN-Standard-A"),
    "kok": _lang_entry("kok-IN", "kok-IN-Standard-A", "kok-IN-Standard-A"),
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
