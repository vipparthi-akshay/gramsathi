from typing import Optional

from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.database import Base


class NotificationTemplate(Base):
    __tablename__ = "notification_templates"

    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title_template: Mapped[str] = mapped_column(String(500), nullable=False)
    body_template: Mapped[str] = mapped_column(Text, nullable=False)
    variables: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    channels: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
