"""
Counselling appointment booking — pastor availability slots + member bookings.
"""

from datetime import datetime, date, time as time_type
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Boolean, Date, Time, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class CounsellingAvailability(Base):
    """A weekly recurring slot a pastor is available."""
    __tablename__ = "counselling_availability"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pastor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Mon ... 6=Sun
    start_time: Mapped[time_type] = mapped_column(Time, nullable=False)
    end_time: Mapped[time_type] = mapped_column(Time, nullable=False)
    slot_minutes: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CounsellingBooking(Base):
    __tablename__ = "counselling_bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_name: Mapped[str] = mapped_column(String(200), nullable=False)
    user_email: Mapped[str] = mapped_column(String(200), nullable=False)
    user_phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    pastor_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    topic: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/confirmed/completed/cancelled
    pastor_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
