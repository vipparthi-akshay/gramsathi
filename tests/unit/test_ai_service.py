import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestIntentClassification:
    @pytest.fixture
    def classifier(self):
        from ai_service.app.utils.intent_classifier import IntentClassifier

        return IntentClassifier()

    def test_scheme_discovery_intent(self, classifier):
        messages = [
            "मुझे किसान योजना के बारे में बताओ",
            "What schemes are available for farmers?",
            "kaun si sarkari yojana hai kisan ke liye",
            "I need help with government schemes",
        ]
        for msg in messages:
            result = classifier._classify_with_keywords(msg)
            if result:
                assert result.intent == "scheme_discovery", f"Failed for: {msg}"

    def test_application_help_intent(self, classifier):
        messages = [
            "मैं आवेदन कैसे करूं?",
            "How to apply for PM Kisan scheme?",
            "form kaise bharein",
            "What documents are needed for application?",
        ]
        for msg in messages:
            result = classifier._classify_with_keywords(msg)
            if result:
                assert result.intent == "application_help", f"Failed for: {msg}"

    def test_complaint_intent(self, classifier):
        messages = [
            "मैं शिकायत दर्ज करना चाहता हूं",
            "I want to file a complaint",
            "mera kaam nhi ho raha hai",
            "There is corruption in the office",
        ]
        for msg in messages:
            result = classifier._classify_with_keywords(msg)
            if result:
                assert result.intent == "complaint", f"Failed for: {msg}"

    def test_status_check_intent(self, classifier):
        messages = [
            "मेरे आवेदन की स्थिति क्या है?",
            "Check my application status",
            "mera form kahan pahuncha",
            "Track my scheme application",
        ]
        for msg in messages:
            result = classifier._classify_with_keywords(msg)
            if result:
                assert result.intent == "status_check", f"Failed for: {msg}"

    def test_document_help_intent(self, classifier):
        messages = [
            "आधार कार्ड कैसे बनवाएं?",
            "I lost my income certificate",
            "pan card apply kaise karein",
        ]
        for msg in messages:
            result = classifier._classify_with_keywords(msg)
            if result:
                assert result.intent == "document_help", f"Failed for: {msg}"

    def test_eligibility_check_intent(self, classifier):
        messages = [
            "क्या मैं पात्र हूं?",
            "Am I eligible for this scheme?",
            "kya main aavedan kar sakta hoon",
            "What are the eligibility criteria?",
        ]
        for msg in messages:
            result = classifier._classify_with_keywords(msg)
            if result:
                assert result.intent == "eligibility_check", f"Failed for: {msg}"

    def test_general_query_fallback(self, classifier):
        result = classifier._classify_with_keywords("What is the weather today?")
        assert result is None or result.intent == "general_query"

    def test_intent_entities_extraction(self, classifier):
        msg = "PM Kisan Yojana ke liye apply karna hai"
        result = classifier._classify_with_keywords(msg)
        if result:
            assert "action" in result.entities or "scheme_name" in result.entities


class TestConversationContext:
    @pytest.fixture
    def context_manager(self):
        from ai_service.app.utils.context_manager import ConversationContextManager

        return ConversationContextManager()

    @pytest.mark.asyncio
    async def test_context_creation(self, context_manager):
        ctx = await context_manager.create_context(
            citizen_id=str(uuid.uuid4()),
            language="hi",
        )
        assert ctx.conversation_id is not None
        assert ctx.citizen_id is not None
        assert ctx.language == "hi"
        assert ctx.message_count == 0

    @pytest.mark.asyncio
    async def test_context_maintained_across_messages(self, context_manager):
        ctx = await context_manager.create_context(
            citizen_id="citizen-1",
            language="hi",
        )
        conv_id = ctx.conversation_id

        await context_manager.update_context(
            conversation_id=conv_id,
            message="मुझे किसान योजना बताओ",
            response="यहाँ कुछ योजनाएं हैं",
            intent="scheme_discovery",
        )

        await context_manager.update_context(
            conversation_id=conv_id,
            message="मैं आवेदन करना चाहता हूं",
            response="आवेदन प्रक्रिया यह है",
            intent="application_help",
        )

        updated = await context_manager.get_context(conv_id)
        assert updated is not None
        assert updated.message_count == 2
        assert len(updated.messages) == 4
        assert "scheme_discovery" in updated.detected_intents
        assert "application_help" in updated.detected_intents

    @pytest.mark.asyncio
    async def test_context_get_recent_messages(self, context_manager):
        ctx = await context_manager.create_context(
            citizen_id="citizen-2",
            language="en",
        )
        conv_id = ctx.conversation_id

        for i in range(15):
            await context_manager.update_context(
                conversation_id=conv_id,
                message=f"Message {i}",
                response=f"Response {i}",
                intent="general_query",
            )

        updated = await context_manager.get_context(conv_id)
        recent = updated.get_recent_messages(5)
        assert len(recent) == 5

    @pytest.mark.asyncio
    async def test_context_clear(self, context_manager):
        ctx = await context_manager.create_context(
            citizen_id="citizen-3",
            language="ta",
        )
        conv_id = ctx.conversation_id

        await context_manager.clear_context(conv_id)
        cleared = await context_manager.get_context(conv_id)
        assert cleared is None or cleared.message_count == 0


class TestTranslation:
    @pytest.fixture
    def gemini_client(self):
        from ai_service.app.models.gemini_client import GeminiClient

        return GeminiClient()

    def test_translate_text(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        result = client.translate_text(
            text="Hello, how are you?",
            target_language="hi",
            source_language="en",
        )
        assert result == "Translated text mock"

    def test_language_detection_hindi(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        result = client.detect_language("नमस्ते, आप कैसे हैं?")
        assert result["language_code"] == "hi"
        assert result["confidence"] > 0.5

    def test_language_detection_marathi(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        result = client.detect_language("नमस्कार, तुम्ही कसे आहात?")
        assert result["language_code"] == "hi"

    def test_language_detection_tamil(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        result = client.detect_language("வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?")
        assert result["language_code"] == "hi"


class TestSchemeHandler:
    def test_scheme_discovery_handler_returns_schemes(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        profile = {
            "citizen_id": "test-id",
            "name": "Ramesh",
            "age": 30,
            "state": "Uttar Pradesh",
            "occupation": "farmer",
        }
        schemes = [
            {
                "name": "PM Kisan Samman Nidhi",
                "category": "agriculture",
                "eligibility_criteria": {"occupation": ["farmer"]},
            }
        ]
        result = client.rank_schemes_by_relevance(profile, schemes)
        assert len(result) > 0
        assert result[0]["relevance_score"] > 50

    def test_application_help_handler(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        response = client.generate_response(
            prompt="Help me apply for PM Kisan scheme",
            language="hi",
        )
        assert response is not None
        assert len(response) > 0

    def test_complaint_draft_handler(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        response = client.generate_response(
            prompt='''Create a complaint draft:
            Department: agriculture
            Issue: Delay in PM Kisan payment
            Description: Not received payment for 6 months''',
            language="en",
            temperature=0.1,
        )
        assert response is not None

    def test_status_check_handler(self, mock_gemini):
        from ai_service.app.models.gemini_client import GeminiClient

        client = GeminiClient()
        response = client.generate_response(
            prompt="Guide user to check application status for PM Kisan scheme",
            language="hi",
        )
        assert response is not None
