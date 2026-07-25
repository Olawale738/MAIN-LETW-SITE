"""
SMS provider config — admin registers an SMS gateway (Termii, Twilio,
Africa's Talking, or a custom HTTP endpoint) and activates it. One provider
is active at a time; the send helper uses whichever is marked is_active.

Secrets live here (admin-only endpoints), never in the public ministry-content.
"""

from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class SmsProvider(Base):
    __tablename__ = "sms_providers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # provider controls send behaviour: 'termii' | 'twilio' | 'africastalking' | 'custom'
    provider: Mapped[str] = mapped_column(String(40), nullable=False, default="termii")
    name: Mapped[str] = mapped_column(String(200), nullable=False, default="SMS")
    api_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    api_secret: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Twilio auth token / AT username
    sender_id: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)   # approved sender name / from-number
    # custom: base_url + config placeholders ({to},{message},{sender})
    base_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    config: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
