"""
Kids Ministry registration model
"""

import uuid
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Integer, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class KidsRegistrationStatus(str, enum.Enum):
    """Status of kids ministry registrations"""
    PENDING = "pending"
    APPROVED = "approved"
    DECLINED = "declined"


class KidsMinistryRegistration(Base):
    """Kids ministry registration submissions"""
    __tablename__ = "kids_ministry_registrations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    child_name: Mapped[str] = mapped_column(String(255), nullable=False)
    child_age: Mapped[int] = mapped_column(Integer, nullable=False)
    age_group: Mapped[str] = mapped_column(String(50), nullable=False)  # Nursery (2-5), Elementary (6-12), Youth (13-17)
    parent_name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_email: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    special_needs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[KidsRegistrationStatus] = mapped_column(
        SQLEnum(KidsRegistrationStatus),
        default=KidsRegistrationStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
