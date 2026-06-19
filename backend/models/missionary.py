"""
Missionary & Sponsorship — adopt-a-missionary model.
Members give monthly to a specific missionary; missionaries post updates.
"""

from datetime import datetime, date
from typing import Optional, Any
from sqlalchemy import String, DateTime, Date, Text, Boolean, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class Missionary(Base):
    __tablename__ = "missionaries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    family_size: Mapped[int] = mapped_column(Integer, default=1)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    organisation: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    ministry_focus: Mapped[str] = mapped_column(String(500), nullable=False)  # short one-liner
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    monthly_support_goal: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    contact_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    sent_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    prayer_points: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=list)  # list of strings
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MissionaryUpdate(Base):
    __tablename__ = "missionary_updates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    missionary_id: Mapped[str] = mapped_column(String(36), ForeignKey("missionaries.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    hero_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    published_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class MissionarySponsorship(Base):
    __tablename__ = "missionary_sponsorships"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    missionary_id: Mapped[str] = mapped_column(String(36), ForeignKey("missionaries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    supporter_name: Mapped[str] = mapped_column(String(200), nullable=False)
    supporter_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    monthly_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    started_on: Mapped[date] = mapped_column(Date, default=date.today)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
