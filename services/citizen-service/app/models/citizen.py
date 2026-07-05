import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.database import Base


class Citizen(Base):
    __tablename__ = "citizens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    aadhaar_hash: Mapped[str] = mapped_column(String(64), nullable=True)
    mobile_number: Mapped[str] = mapped_column(String(15), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=True)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=True)
    gender: Mapped[str] = mapped_column(String(20), nullable=True)
    caste_category: Mapped[str] = mapped_column(String(50), nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=True)
    district: Mapped[str] = mapped_column(String(100), nullable=True)
    block: Mapped[str] = mapped_column(String(100), nullable=True)
    village: Mapped[str] = mapped_column(String(100), nullable=True)
    pin_code: Mapped[str] = mapped_column(String(10), nullable=True)
    annual_income: Mapped[float] = mapped_column(Numeric(12, 2), nullable=True)
    is_farmer: Mapped[bool] = mapped_column(Boolean, default=False)
    has_disability: Mapped[bool] = mapped_column(Boolean, default=False)
    disability_type: Mapped[str] = mapped_column(String(100), nullable=True)
    education_level: Mapped[str] = mapped_column(String(100), nullable=True)
    occupation: Mapped[str] = mapped_column(String(200), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(10), nullable=True)
    preferred_dialect: Mapped[str] = mapped_column(String(50), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    family_members = relationship(
        "FamilyMember", back_populates="citizen", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Citizen {self.id} user={self.user_id}>"
