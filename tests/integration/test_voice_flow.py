import base64
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestVoiceConversationFlow:
    @pytest.mark.asyncio
    async def test_full_voice_session_flow(self, mock_gemini, mock_cloud_stt):
        from ai_service.app.routers.voice import (
            VOICE_SESSIONS,
            process_voice_chunk,
            start_voice_session,
            end_voice_session,
        )
        from ai_service.app.schemas.voice import (
            VoiceChunkRequest,
            VoiceStartRequest,
        )
        from ai_service.app.utils.context_manager import ConversationContextManager

        ctx_manager = ConversationContextManager()
        citizen_id = str(uuid.uuid4())

        start_req = VoiceStartRequest(
            language="hi",
            citizen_id=citizen_id,
        )
        start_resp = await start_voice_session(start_req, ctx_manager)
        assert start_resp.session_id is not None
        assert start_resp.expires_in == 300
        assert start_resp.session_id in VOICE_SESSIONS

        audio_bytes = b"mock_audio_data"
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        chunk_req = VoiceChunkRequest(
            session_id=start_resp.session_id,
            audio_base64=audio_b64,
            encoding="LINEAR16",
            sample_rate=16000,
        )

        chunk_resp = await process_voice_chunk(
            chunk_req,
            speech_client=mock_cloud_stt,
            gemini=mock_gemini,
            ctx_manager=ctx_manager,
            classifier=MagicMock(),
        )

        assert chunk_resp.transcript is not None
        assert len(chunk_resp.transcript) > 0
        assert chunk_resp.is_final is True
        assert chunk_resp.suggested_actions is not None

        session = VOICE_SESSIONS.get(start_resp.session_id)
        assert session is not None
        assert session["message_count"] >= 1

        end_resp = await end_voice_session(start_resp.session_id, ctx_manager)
        assert end_resp.session_id == start_resp.session_id
        assert end_resp.duration >= 0
        assert end_resp.message_count >= 1

    @pytest.mark.asyncio
    async def test_voice_session_not_found(self):
        from ai_service.app.routers.voice import process_voice_chunk
        from ai_service.app.schemas.voice import VoiceChunkRequest

        chunk_req = VoiceChunkRequest(
            session_id="nonexistent-session",
            audio_base64=base64.b64encode(b"test").decode(),
        )

        with pytest.raises(Exception):
            await process_voice_chunk(
                chunk_req,
                speech_client=MagicMock(),
                gemini=MagicMock(),
                ctx_manager=MagicMock(),
                classifier=MagicMock(),
            )

    @pytest.mark.asyncio
    async def test_voice_chunk_empty_transcript(self, mock_cloud_stt):
        from ai_service.app.routers.voice import (
            VOICE_SESSIONS,
            process_voice_chunk,
            start_voice_session,
        )
        from ai_service.app.schemas.voice import (
            VoiceChunkRequest,
            VoiceStartRequest,
        )
        from ai_service.app.utils.context_manager import ConversationContextManager

        empty_stt = MagicMock()
        transcript_mock = MagicMock()
        transcript_mock.transcript = ""
        transcript_mock.confidence = 0.0
        empty_stt.transcribe_audio.return_value = transcript_mock

        ctx_manager = ConversationContextManager()
        start_req = VoiceStartRequest(language="hi", citizen_id=str(uuid.uuid4()))
        start_resp = await start_voice_session(start_req, ctx_manager)

        chunk_req = VoiceChunkRequest(
            session_id=start_resp.session_id,
            audio_base64=base64.b64encode(b"silence").decode(),
        )
        chunk_resp = await process_voice_chunk(
            chunk_req,
            speech_client=empty_stt,
            gemini=MagicMock(),
            ctx_manager=ctx_manager,
            classifier=MagicMock(),
        )
        assert chunk_resp.transcript == ""
        assert chunk_resp.audio_response_base64 is None
        assert not chunk_resp.is_final

    @pytest.mark.asyncio
    async def test_stt_ai_tts_pipeline(self, mock_gemini, mock_cloud_stt):
        from ai_service.app.models.speech_client import SpeechClient

        client = SpeechClient()
        audio_bytes = b"test_audio_bytes"

        transcript_result = client.transcribe_audio(
            audio_bytes=audio_bytes,
            language="hi",
        )
        assert transcript_result.transcript is not None
        assert transcript_result.confidence > 0.5

        response_text = mock_gemini.generate_response(
            prompt=transcript_result.transcript,
            language=transcript_result.language,
        )
        assert response_text is not None

        audio_response = client.synthesize_speech(
            text=response_text,
            language="hi",
        )
        assert audio_response.audio_bytes is not None
        assert audio_response.encoding == "WAV"

    @pytest.mark.asyncio
    async def test_voice_session_multiple_chunks(self, mock_gemini, mock_cloud_stt):
        from ai_service.app.routers.voice import (
            VOICE_SESSIONS,
            process_voice_chunk,
            end_voice_session,
            start_voice_session,
        )
        from ai_service.app.schemas.voice import (
            VoiceChunkRequest,
            VoiceStartRequest,
        )
        from ai_service.app.utils.context_manager import ConversationContextManager

        ctx_manager = ConversationContextManager()
        start_req = VoiceStartRequest(language="hi", citizen_id=str(uuid.uuid4()))
        start_resp = await start_voice_session(start_req, ctx_manager)

        for _ in range(3):
            chunk_req = VoiceChunkRequest(
                session_id=start_resp.session_id,
                audio_base64=base64.b64encode(b"chunk_data").decode(),
            )
            await process_voice_chunk(
                chunk_req,
                speech_client=mock_cloud_stt,
                gemini=mock_gemini,
                ctx_manager=ctx_manager,
                classifier=MagicMock(),
            )

        session = VOICE_SESSIONS[start_resp.session_id]
        assert session["message_count"] == 3
        assert len(session["audio_chunks"]) == 3

        end_resp = await end_voice_session(start_resp.session_id, ctx_manager)
        assert end_resp.message_count == 3
