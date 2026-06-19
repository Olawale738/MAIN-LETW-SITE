"""
Global Online Campus — turn the livestream into a real church service.

Models:
- OnlineService: a scheduled service (Sunday 9am, etc.)
- AltarCallResponse: someone responded to an altar call during service
- RaiseHand: someone needs immediate pastoral attention during service
- OnlineCommunion: schedule a private online communion session
"""

from datetime import datetime, date as date_type
from typing import Optional
from sqlalchemy import String, DateTime, Boolean, Text, ForeignKey, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class OnlineService(Base):
    __tablename__ = "online_services"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    is_live: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    livestream_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    chat_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    altar_call_open: Mapped[bool] = mapped_column(Boolean, default=False)
    raise_hand_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    viewer_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class AltarCallResponse(Base):
    __tablename__ = "altar_call_responses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("online_services.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    # kind: salvation | rededication | baptism_request | prayer_for_healing | other
    kind: Mapped[str] = mapped_column(String(40), default="salvation", index=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    followed_up: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    followed_up_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    followed_up_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class RaiseHand(Base):
    __tablename__ = "raise_hand_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("online_services.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False, default="Online attendee")
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # status: open | attending | closed
    status: Mapped[str] = mapped_column(String(20), default="open", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class OnlineCommunion(Base):
    __tablename__ = "online_communions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    requested_date: Mapped[date_type] = mapped_column(Date, nullable=False)
    timezone: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="requested", index=True)  # requested/confirmed/completed/cancelled
    confirmed_datetime: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    confirmed_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
