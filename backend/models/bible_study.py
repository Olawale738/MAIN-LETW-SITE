"""
Bible Study models for reading plans and progress tracking
"""
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey, Date, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import enum


class ReadingPlanType(str, enum.Enum):
    """Types of reading plans"""
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class ReadingStatus(str, enum.Enum):
    """Status of a reading entry"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class BibleReadingPlan(Base):
    """Bible reading plans created by admin"""
    __tablename__ = "bible_reading_plans"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    plan_type: Mapped[ReadingPlanType] = mapped_column(SQLEnum(ReadingPlanType), default=ReadingPlanType.WEEKLY)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)  # Total days in the plan
    target_audience: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # e.g., "Children 6-12 years"
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    readings: Mapped[List["DailyReading"]] = relationship("DailyReading", back_populates="plan", cascade="all, delete-orphan")
    user_progress: Mapped[List["UserReadingProgress"]] = relationship("UserReadingProgress", back_populates="plan", cascade="all, delete-orphan")


class DailyReading(Base):
    """Daily reading entries for a plan"""
    __tablename__ = "daily_readings"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("bible_reading_plans.id"), nullable=False)
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)  # Day 1, 2, 3, etc.
    title: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., "Genesis 1-3"
    scripture_reference: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., "Genesis 1:1-3:24"
    reflection: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Optional reflection/notes
    key_verse: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    plan: Mapped["BibleReadingPlan"] = relationship("BibleReadingPlan", back_populates="readings")
    user_readings: Mapped[List["UserDailyReading"]] = relationship("UserDailyReading", back_populates="daily_reading", cascade="all, delete-orphan")


class UserReadingProgress(Base):
    """User's progress on a reading plan"""
    __tablename__ = "user_reading_progress"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("bible_reading_plans.id"), nullable=False)
    start_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    current_day: Mapped[int] = mapped_column(Integer, default=1)
    completed_days: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)  # User can pause/resume
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reading_progress")
    plan: Mapped["BibleReadingPlan"] = relationship("BibleReadingPlan", back_populates="user_progress")
    daily_readings: Mapped[List["UserDailyReading"]] = relationship("UserDailyReading", back_populates="progress", cascade="all, delete-orphan")


class UserDailyReading(Base):
    """User's completion status for individual daily readings"""
    __tablename__ = "user_daily_readings"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    progress_id: Mapped[str] = mapped_column(String(36), ForeignKey("user_reading_progress.id"), nullable=False)
    daily_reading_id: Mapped[str] = mapped_column(String(36), ForeignKey("daily_readings.id"), nullable=False)
    status: Mapped[ReadingStatus] = mapped_column(SQLEnum(ReadingStatus), default=ReadingStatus.NOT_STARTED)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # User's personal notes
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    progress: Mapped["UserReadingProgress"] = relationship("UserReadingProgress", back_populates="daily_readings")
    daily_reading: Mapped["DailyReading"] = relationship("DailyReading", back_populates="user_readings")


class BibleStudyResource(Base):
    """Additional Bible study resources uploaded by admin"""
    __tablename__ = "bible_study_resources"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "video", "pdf", "article", "audio"
    resource_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., "Devotional", "Commentary"
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BibleStudyPageSettings(Base):
    """Settings for the Bible Study page"""
    __tablename__ = "bible_study_page_settings"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Hero Section
    hero_title: Mapped[str] = mapped_column(String(255), default="Weekly Bible Reading Plan")
    hero_subtitle: Mapped[str] = mapped_column(String(255), default="Building a Strong Foundation in God's Word")
    hero_description: Mapped[str] = mapped_column(Text, default="Join us in reading through the Bible systematically")
    hero_background_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

