"""
Live Prayer Command Center — intercessor rota + prayer request matching.

Members submit prayer requests via existing PrayerRequest. An intercessor
on the rota is matched and assigned. Anonymous mode supported.
"""

from datetime import datetime, time as time_type
from typing import Optional
from sqlalchemy import String, DateTime, Time, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class Intercessor(Base):
    __tablename__ = "intercessors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    languages: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # csv
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_available_now: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    last_assigned_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    total_prayed_for: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class IntercessionRequest(Base):
    """A prayer ask routed through the live command center.
    Lighter than PrayerRequest — designed for fast turn-around."""
    __tablename__ = "intercession_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    requester_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False, default="A child of God")
    category: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    intercessor_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("intercessors.id", ondelete="SET NULL"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="waiting", index=True)  # waiting/assigned/praying/answered/closed
    answered_testimony: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    assigned_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
