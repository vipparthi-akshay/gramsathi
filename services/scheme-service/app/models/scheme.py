import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.database import Base


class Scheme(Base):
    __tablename__ = "schemes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    name_hindi: Mapped[str] = mapped_column(String(300), nullable=True)
    name_local: Mapped[str] = mapped_column(String(300), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    description_hindi: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    ministry: Mapped[str] = mapped_column(String(200), nullable=True)
    state_specific: Mapped[str] = mapped_column(String(100), nullable=True)
    eligibility_criteria: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    benefits: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    required_documents: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    application_start: Mapped[date] = mapped_column(Date, nullable=True)
    application_end: Mapped[date] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    scheme_url: Mapped[str] = mapped_column(String(500), nullable=True)
    cpgrams_code: Mapped[str] = mapped_column(String(50), nullable=True)
    tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    match_keywords: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    applications = relationship("Application", back_populates="scheme")

    def __repr__(self) -> str:
        return f"<Scheme {self.id} {self.name}>"
