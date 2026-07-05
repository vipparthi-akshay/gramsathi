from app.routers.chat import router as chat_router
from app.routers.voice import router as voice_router
from app.routers.ocr import router as ocr_router
from app.routers.translate import router as translate_router

__all__ = [
    "chat_router",
    "voice_router",
    "ocr_router",
    "translate_router",
]
