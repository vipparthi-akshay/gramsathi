import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat_router, ocr_router, translate_router, voice_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GramSathi AI Service",
    description="AI-powered multilingual assistant for Indian government scheme discovery, application help, and document processing",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(voice_router)
app.include_router(ocr_router)
app.include_router(translate_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-service"}
