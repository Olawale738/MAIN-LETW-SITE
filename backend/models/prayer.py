"""
Prayer models for managing prayer categories, schedules, and requests
"""

import uuid
import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Text, Integer, Boolean, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class PrayerCategory(Base):
    """Prayer experience categories (e.g., Global Intercession, Healing & Deliverance)"""
    __tablename__ = "prayer_categories"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Lucide icon name
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PrayerSchedule(Base):
    """Prayer schedule/programs (e.g., Daily Prayer Hour, All-Night Vigil)"""
    __tablename__ = "prayer_schedules"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_name: Mapped[str] = mapped_column(String(255), nullable=False)
    time_description: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., "Every Day • 7:00 PM GMT"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Lucide icon name
    meeting_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PrayerStat(Base):
    """Impact statistics displayed on the prayer page"""
    __tablename__ = "prayer_stats"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    label: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., "Nations Interceding"
    value: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "178"
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PrayerRequestStatus(str, enum.Enum):
    """Status of prayer requests"""
    PENDING = "pending"
    PRAYING = "praying"
    ANSWERED = "answered"
    ARCHIVED = "archived"


class PrayerRequest(Base):
    """User-submitted prayer requests"""
    __tablename__ = "prayer_requests"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., "healing", "family", "financial"
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)  # Can others see and pray for this?
    status: Mapped[PrayerRequestStatus] = mapped_column(
        SQLEnum(PrayerRequestStatus, native_enum=False),
        default=PrayerRequestStatus.PENDING
    )
    prayer_count: Mapped[int] = mapped_column(Integer, default=0)  # Number of people who prayed
    testimony: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Answered prayer testimony
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="prayer_requests")
    prayers: Mapped[List["UserPrayer"]] = relationship("UserPrayer", back_populates="prayer_request", cascade="all, delete-orphan")


class UserPrayer(Base):
    """Track which users have prayed for which requests"""
    __tablename__ = "user_prayers"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    prayer_request_id: Mapped[str] = mapped_column(String(36), ForeignKey("prayer_requests.id"), nullable=False)
    prayed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    prayer_request: Mapped["PrayerRequest"] = relationship("PrayerRequest", back_populates="prayers")


class PrayerPageSettings(Base):
    """Global settings for the prayer page (hero image, title, etc.)"""
    __tablename__ = "prayer_page_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # ── Hero band ───────────────────────────────────────────────────────
    hero_eyebrow: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, default="United in Prayer")
    hero_title: Mapped[str] = mapped_column(String(255), default="Global Prayer Altar")
    hero_subtitle: Mapped[str] = mapped_column(String(255), default="Where heaven touches earth.")
    hero_description: Mapped[str] = mapped_column(Text, default="Millions united. Nations transformed. Breakthrough released.")
    hero_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    primary_cta_text: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, default="Enter the Prayer Room")
    primary_cta_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    secondary_cta_text: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, default="Submit a Prayer Request")
    secondary_cta_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default="/prayer-request")

    # ── Stats band ──────────────────────────────────────────────────────
    stats_eyebrow: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, default="The Movement")
    stats_heading: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="Lives Touched. Nations Shifted.")
    stats_subtitle: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Categories grid ─────────────────────────────────────────────────
    categories_eyebrow: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, default="United in Prayer")
    categories_heading: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="What Happens When We Pray Together")
    categories_subtitle: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Schedules grid (was previously completely unrendered) ───────────
    schedules_eyebrow: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, default="When We Gather")
    schedules_heading: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="Join a Prayer Gathering")
    schedules_subtitle: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Final CTA "The Altar is Open" ───────────────────────────────────
    final_eyebrow: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, default="The Altar Is Open")
    final_heading: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="Will You Step In?")
    scripture_text: Mapped[str] = mapped_column(Text, default="My house shall be called a house of prayer for all nations.")
    scripture_reference: Mapped[str] = mapped_column(String(100), default="Isaiah 56:7")
    call_to_action_text: Mapped[str] = mapped_column(Text, default="Join the global prayer movement. Your voice matters. Your prayer changes history.")
    live_prayer_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

