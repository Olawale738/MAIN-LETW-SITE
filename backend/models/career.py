"""
Career Guidance models for the church portal.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import enum


class ResourceType(str, enum.Enum):
    """Types of career resources."""
    PDF = "pdf"
    VIDEO = "video"
    ARTICLE = "article"
    LINK = "link"


class SessionStatus(str, enum.Enum):
    """Status of career guidance sessions."""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class TaskStatus(str, enum.Enum):
    """Status of user career tasks."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class CareerModule(Base):
    """Career guidance modules (e.g., Career Discovery, Resume Building)."""
    
    __tablename__ = "career_modules"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # lucide icon name
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    resources: Mapped[List["CareerResource"]] = relationship(
        "CareerResource",
        back_populates="module",
        cascade="all, delete-orphan"
    )
    tasks: Mapped[List["CareerTask"]] = relationship(
        "CareerTask",
        back_populates="module",
        cascade="all, delete-orphan"
    )


class CareerResource(Base):
    """Resources within career modules (PDFs, videos, articles)."""
    
    __tablename__ = "career_resources"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    module_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("career_modules.id", ondelete="CASCADE"),
        nullable=False
    )
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resource_type: Mapped[str] = mapped_column(String(20), nullable=False)  # pdf, video, article, link
    
    # For different resource types
    file_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)  # For PDFs
    video_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)  # YouTube URL
    article_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Rich text content
    external_link: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)  # External links
    
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    # Relationships
    module: Mapped["CareerModule"] = relationship("CareerModule", back_populates="resources")


class CareerSession(Base):
    """Scheduled career guidance/mentorship sessions."""
    
    __tablename__ = "career_sessions"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    session_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    meeting_link: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=SessionStatus.SCHEDULED.value)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])


class CareerTask(Base):
    """Action items/tasks for career modules."""

    __tablename__ = "career_tasks"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    module_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("career_modules.id", ondelete="CASCADE"),
        nullable=False
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    module: Mapped["CareerModule"] = relationship("CareerModule", back_populates="tasks")


class UserCareerProgress(Base):
    """Track user progress through career modules."""

    __tablename__ = "user_career_progress"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    module_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("career_modules.id", ondelete="CASCADE"),
        nullable=False
    )

    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    current_focus: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    module: Mapped["CareerModule"] = relationship("CareerModule", foreign_keys=[module_id])


class UserCareerTask(Base):
    """Track user completion of career tasks."""

    __tablename__ = "user_career_tasks"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    task_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("career_tasks.id", ondelete="CASCADE"),
        nullable=False
    )

    status: Mapped[str] = mapped_column(String(20), default=TaskStatus.PENDING.value)

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    task: Mapped["CareerTask"] = relationship("CareerTask", foreign_keys=[task_id])

