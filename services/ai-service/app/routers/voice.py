import base64
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException

from app.models.gemini_client import GeminiClient
from app.models.speech_client import SpeechClient
from app.schemas.voice import (
    VoiceChunkRequest,
    VoiceChunkResponse,
    VoiceEndResponse,
    VoiceStartRequest,
    VoiceStartResponse,
)
from app.utils.context_manager import ConversationContextManager
from app.utils.intent_classifier import IntentClassifier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/voice")


def get_speech_client() -> SpeechClient:
    return SpeechClient()


def get_gemini_client() -> GeminiClient:
    return GeminiClient()


def get_context_manager() -> ConversationContextManager:
    return ConversationContextManager()


def get_intent_classifier() -> IntentClassifier:
    return IntentClassifier()


VOICE_SESSIONS: Dict[str, Dict] = {}


@router.post("/api/v1/ai/voice/start", response_model=VoiceStartResponse)
async def start_voice_session(
    request: VoiceStartRequest,
    ctx_manager: ConversationContextManager = Depends(get_context_manager),
):
    session_id = f"voice-{uuid.uuid4().hex[:16]}"

    ctx = await ctx_manager.create_context(
        citizen_id=request.citizen_id,
        language=request.language,
        dialect=request.dialect,
        conversation_id=f"voice-conv-{uuid.uuid4().hex[:16]}",
    )

    VOICE_SESSIONS[session_id] = {
        "session_id": session_id,
        "conversation_id": ctx.conversation_id,
        "citizen_id": request.citizen_id,
        "language": request.language,
        "dialect": request.dialect,
        "started_at": datetime.now(timezone.utc),
        "message_count": 0,
        "audio_chunks": [],
    }

    return VoiceStartResponse(
        session_id=session_id,
        expires_in=300,
    )


@router.post("/api/v1/ai/voice/chunk", response_model=VoiceChunkResponse)
async def process_voice_chunk(
    request: VoiceChunkRequest,
    speech_client: SpeechClient = Depends(get_speech_client),
    gemini: GeminiClient = Depends(get_gemini_client),
    ctx_manager: ConversationContextManager = Depends(get_context_manager),
    classifier: IntentClassifier = Depends(get_intent_classifier),
):
    session = VOICE_SESSIONS.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Voice session not found or expired")

    try:
        audio_bytes = base64.b64decode(request.audio_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 audio data")

    transcript_result = speech_client.transcribe_audio(
        audio_bytes=audio_bytes,
        language=session["language"],
        dialect=session.get("dialect"),
        encoding=request.encoding,
        sample_rate=request.sample_rate,
    )

    transcript = transcript_result.transcript
    if not transcript.strip():
        return VoiceChunkResponse(
            transcript="",
            audio_response_base64=None,
            is_final=False,
            suggested_actions=["Could you please say that again?"],
        )

    session["message_count"] += 1
    session["audio_chunks"].append({
        "transcript": transcript,
        "confidence": transcript_result.confidence,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    intent_result = classifier.classify_intent(transcript, session["language"])
    intent = intent_result.intent

    ctx = await ctx_manager.get_context(session["conversation_id"])
    conversation_history = ""
    if ctx:
        recent = ctx.get_recent_messages(6)
        conversation_history = "\n".join(
            f"{m['role']}: {m['content']}" for m in recent
        )

    prompt = (
        f"You are a helpful government assistant. Respond conversationally.\n\n"
        f"Conversation history:\n{conversation_history}\n\n"
        f"User's voice input: {transcript}\n"
        f"Detected intent: {intent}\n\n"
        f"Provide a helpful response in {session['language']}. "
        f"Keep responses concise since this will be converted to speech."
    )

    response_text = gemini.generate_response(
        prompt=prompt,
        language=session["language"],
        dialect=session.get("dialect"),
        temperature=0.3,
    )

    if ctx:
        await ctx_manager.update_context(
            conversation_id=session["conversation_id"],
            message=transcript,
            response=response_text,
            intent=intent,
            metadata={"source": "voice", "transcript_confidence": transcript_result.confidence},
        )

    audio_response = speech_client.synthesize_speech(
        text=response_text,
        language=session["language"],
        gender_preference="female",
    )

    audio_response_b64 = base64.b64encode(audio_response.audio_bytes).decode("utf-8")

    suggested_actions = _get_voice_suggested_actions(intent, session["language"])

    return VoiceChunkResponse(
        transcript=transcript,
        audio_response_base64=audio_response_b64,
        is_final=True,
        suggested_actions=suggested_actions,
    )


def _get_voice_suggested_actions(intent: str, language: str) -> list:
    if language == "hi":
        common = ["जारी रखें", "रुकिए", "दोहराएं", "मदद चाहिए"]
    else:
        common = ["Continue", "Stop", "Repeat", "Need help"]

    intent_actions = {
        "scheme_discovery": [],
        "application_help": [],
        "complaint": [],
        "status_check": [],
        "document_help": [],
        "eligibility_check": [],
        "general_query": [],
    }
    return common + intent_actions.get(intent, [])


@router.post("/api/v1/ai/voice/end/{session_id}", response_model=VoiceEndResponse)
async def end_voice_session(
    session_id: str,
    ctx_manager: ConversationContextManager = Depends(get_context_manager),
):
    session = VOICE_SESSIONS.pop(session_id, None)
    if not session:
        raise HTTPException(status_code=404, detail="Voice session not found")

    duration_seconds = int(
        (datetime.now(timezone.utc) - session["started_at"]).total_seconds()
    )

    await ctx_manager.save_conversation_summary(session["conversation_id"])
    ctx = await ctx_manager.get_context(session["conversation_id"])

    return VoiceEndResponse(
        session_id=session_id,
        duration=duration_seconds,
        message_count=session["message_count"],
        summary=ctx.metadata.get("summary", "Conversation ended") if ctx else "Conversation ended",
    )
