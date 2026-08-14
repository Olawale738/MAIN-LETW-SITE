"""
LifeEventRequest — wedding / baptism / child dedication / etc.
Couple/family submits → admin approves/declines → reminders sent.
"""

from datetime import datetime, date
from typing import Optional, Any
from sqlalchemy import String, DateTime, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class LifeEventRequest(Base):
    __tablename__ = "life_event_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kind: Mapped[str] = mapped_column(String(40), nullable=False, index=True)  # wedding | baptism | dedication | funeral
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    requester_name: Mapped[str] = mapped_column(String(200), nullable=False)
    requester_email: Mapped[str] = mapped_column(String(200), nullable=False)
    requester_phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    preferred_date: Mapped[date] = mapped_column(Date, nullable=False)
    alternate_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    details: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=dict)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending/approved/declined/completed
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    # Baptism certificate number, minted on approval so sharepoints can issue it.
    certificate_number: Mapped[Optional[str]] = mapped_column(String(40), nullable=True, index=True)
    # Candidate photo (uploaded data-URL or link) — travels with the handshake so
    # the partner system can print it on the baptism certificate.
    photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
