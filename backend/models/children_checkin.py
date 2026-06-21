"""
Children's ministry check-in/out. Each child registered with a guardian +
a 4-digit security code. A check-out can only happen when someone tells the
kiosk that exact code.
"""

import uuid
import random
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def _new_code() -> str:
    return f"{random.randint(0, 9999):04d}"


class ChildProfile(Base):
    __tablename__ = "children_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    birthdate: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    # Age group at last check-in for routing
    age_group: Mapped[str] = mapped_column(String(20), default="kids")  # nursery | toddler | kids | preteen

    guardian_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    guardian_name: Mapped[str] = mapped_column(String(200), nullable=False)
    guardian_phone: Mapped[str] = mapped_column(String(40), nullable=False)

    allergies: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    medical_notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class CheckIn(Base):
    __tablename__ = "children_checkins"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    # 4-digit code printed on the guardian's wristband; required at check-out.
    security_code: Mapped[str] = mapped_column(String(8), default=_new_code, nullable=False, index=True)

    checked_in_at:  Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    checked_in_by:  Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    checked_out_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)
    checked_out_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Where the kid is (sanctuary | kids_wing | nursery)
    location: Mapped[str] = mapped_column(String(40), default="kids_wing")
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
