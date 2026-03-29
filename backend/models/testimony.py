"""
Testimony models for managing user-submitted testimonies with admin approval
"""

import uuid
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class TestimonyStatus(str, enum.Enum):
    """Status of a testimony"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Testimony(Base):
    """User-submitted testimonies requiring admin approval"""
    __tablename__ = "testimonies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    testimony_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TestimonyStatus] = mapped_column(
        SQLEnum(TestimonyStatus),
        default=TestimonyStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
