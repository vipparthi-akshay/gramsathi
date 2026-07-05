import asyncio
import uuid
from datetime import date
from typing import AsyncGenerator, Dict
from unittest.mock import AsyncMock, MagicMock, patch

import fakeredis.aioredis
import pytest
from httpx import ASGITransport, AsyncClient

pytest_plugins = ("pytest_asyncio",)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_session():
    from sqlalchemy.ext.asyncio import (
        AsyncSession,
        async_sessionmaker,
        create_async_engine,
    )

    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    from auth_service.app.models.database import Base as AuthBase
    from scheme_service.app.models.database import Base as SchemeBase
    from document_service.app.models.database import Base as DocBase
    from notification_service.app.models.database import Base as NotifBase

    async with engine.begin() as conn:
        await conn.run_sync(AuthBase.metadata.create_all)
        await conn.run_sync(SchemeBase.metadata.create_all)
        await conn.run_sync(DocBase.metadata.create_all)
        await conn.run_sync(NotifBase.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.fixture
async def async_client():
    from auth_service.app.main import app as auth_app

    transport = ASGITransport(app=auth_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def test_citizen():
    return {
        "id": str(uuid.uuid4()),
        "name": "Ramesh Kumar",
        "date_of_birth": date(1990, 6, 15),
        "age": 34,
        "gender": "male",
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "caste_category": "obc",
        "annual_income": 450000,
        "occupation": "farmer",
        "is_farmer": True,
        "has_disability": False,
        "disability_type": None,
        "education_level": "secondary",
        "land_holding": 2.5,
        "is_bpl": False,
        "mobile_number": "+919876543210",
        "family_size": 4,
        "marital_status": "married",
        "area_type": "rural",
    }


@pytest.fixture
def test_scheme():
    return {
        "id": str(uuid.uuid4()),
        "name": "PM Kisan Samman Nidhi",
        "name_hindi": "प्रधानमंत्री किसान सम्मान निधि",
        "description": "Income support for small and marginal farmers",
        "description_hindi": "छोटे और सीमांत किसानों के लिए आय सहायता",
        "category": "agriculture",
        "ministry": "Ministry of Agriculture",
        "state_specific": None,
        "eligibility_criteria": {
            "age": {"min": 18, "max": 120},
            "income": {"ceiling": 500000},
            "occupation": ["farmer"],
            "state": {"states": ["Uttar Pradesh", "Maharashtra", "Tamil Nadu"]},
            "land_holding": {"max": 5.0},
        },
        "benefits": {"amount": 6000, "frequency": "yearly", "type": "cash_transfer"},
        "required_documents": [
            {"name": "Aadhaar Card", "type": "aadhaar"},
            {"name": "Land Records", "type": "land_record"},
        ],
        "application_start": date(2024, 1, 1),
        "application_end": date(2024, 12, 31),
        "is_active": True,
        "cpgrams_code": "AGRI-001",
        "tags": ["kisan", "farmer", "income support"],
        "match_keywords": {"en": ["farmer", "kisan", "agriculture"], "hi": ["किसान", "खेती"]},
    }


@pytest.fixture
def auth_headers(test_citizen):
    from auth_service.app.utils.security import create_access_token

    token = create_access_token(test_citizen["id"], "citizen")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers():
    admin_id = str(uuid.uuid4())
    from auth_service.app.utils.security import create_access_token

    token = create_access_token(admin_id, "admin")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_gemini():
    with patch("ai_service.app.models.gemini_client.GeminiClient") as mock:
        client = MagicMock()
        client.generate_response.return_value = "This is a mock response in Hindi"
        client.translate_text.return_value = "Translated text mock"
        client.detect_language.return_value = {
            "language": "Hindi",
            "language_code": "hi",
            "confidence": 0.98,
        }
        client.analyze_document.return_value = {
            "aadhaar_number": "1234-5678-9012",
            "name": "Ramesh Kumar",
            "dob": "1990-06-15",
            "gender": "Male",
            "address": "Village, District, State",
        }
        client.rank_schemes_by_relevance.return_value = [
            {
                "scheme_id": "scheme-1",
                "scheme_name": "PM Kisan Samman Nidhi",
                "relevance_score": 95,
                "relevance_reason": "Farmer profile matches",
                "estimated_benefit": "₹6,000/year",
                "eligibility_status": "eligible",
            }
        ]
        client.summarize_conversation.return_value = "User asked about farming schemes."
        mock.return_value = client
        yield client


@pytest.fixture
def mock_cloud_stt():
    with patch("ai_service.app.models.speech_client.SpeechClient") as mock:
        client = MagicMock()
        transcript_mock = MagicMock()
        transcript_mock.transcript = "मुझे किसान योजना के बारे में जानकारी चाहिए"
        transcript_mock.confidence = 0.95
        transcript_mock.language = "hi"
        transcript_mock.dialect = None
        transcript_mock.words = []
        client.transcribe_audio.return_value = transcript_mock

        audio_mock = MagicMock()
        audio_mock.audio_bytes = b"mock_audio_bytes"
        audio_mock.encoding = "WAV"
        audio_mock.sample_rate = 24000
        client.synthesize_speech.return_value = audio_mock

        client.detect_language_from_audio.return_value = {
            "language": "hi",
            "language_name": "Hindi",
            "confidence": 0.95,
        }
        mock.return_value = client
        yield client


@pytest.fixture
def redis_client():
    server = fakeredis.FakeServer()
    redis = fakeredis.aioredis.FakeRedis(server=server, decode_responses=True)
    return redis
