"""
Youth Programs - one row per youth ministry sub-program (Mentorship, Faith &
Fitness, Digital Missions, etc.). Each program has a public detail page at
/youth/{slug} and a member dashboard at /youth/{slug}/dashboard.
"""

import uuid
from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, Text, Integer, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class YouthProgram(Base):
    __tablename__ = "youth_programs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # URL + identity
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    badge: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)              # lucide name
    color_class: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)      # e.g. 'bg-violet-100 text-violet-600'

    # Hero
    hero_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    short_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    long_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Rich content blocks (admin-editable, JSONB so we can grow without migrations)
    # what_youll_do:  list of { title, description, icon? }
    what_youll_do: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=list)
    # who_its_for:   list of strings ("Ages 12-18", "Open to all", etc.)
    who_its_for: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=list)
    # schedule:      list of { day, time, title, description? }
    schedule: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=list)
    # outcomes:      list of strings ("You'll walk away knowing how to...")
    outcomes: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=list)
    # resources:     list of { title, url, type ('pdf'|'video'|'link'), meta? } (shown in dashboard)
    resources: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=list)
    # announcements: list of { title, body, date, urgent } (shown in dashboard)
    announcements: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=list)

    # Leader card
    leader_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    leader_role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    leader_photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    leader_bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Registration
    registration_open: Mapped[bool] = mapped_column(Boolean, default=True)
    join_cta_text: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)    # e.g. "Reserve a Spot"
    service_request_label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # ^ The string used when calling serviceRequestApi.submitRequests([label], ...)
    #   so the youth coordinator inbox shows e.g. "Youth :: Digital Missions"

    # Order + visibility
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
