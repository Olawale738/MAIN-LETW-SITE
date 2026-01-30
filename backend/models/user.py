"""
User database model.
"""

import uuid
import enum
from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base

if TYPE_CHECKING:
    from models.prayer import PrayerRequest
    from models.notification import Notification
    from models.service_request import ServiceRequest
    from models.verification_token import VerificationToken
    from models.announcement import Announcement
    from models.bible_study import UserReadingProgress


class UserStatus(str, enum.Enum):
    """User account status."""
    PENDING = "pending"      # Email not verified
    ACTIVE = "active"        # Email verified, password set
    SUSPENDED = "suspended"  # Account suspended


class UserRole(str, enum.Enum):
    """User role."""
    USER = "user"
    ADMIN = "admin"


class User(Base):
    """User model for authentication and profile."""
    
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    password_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True  # Null until user sets password after email verification
    )
    
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole),
        default=UserRole.USER,
        nullable=False
    )
    
    status: Mapped[UserStatus] = mapped_column(
        SQLEnum(UserStatus),
        default=UserStatus.PENDING,
        nullable=False
    )

    services: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    prayer_requests: Mapped[List["PrayerRequest"]] = relationship("PrayerRequest", back_populates="user", cascade="all, delete-orphan")
    reading_progress: Mapped[List["UserReadingProgress"]] = relationship("UserReadingProgress", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    service_requests: Mapped[List["ServiceRequest"]] = relationship("ServiceRequest", back_populates="user", foreign_keys="[ServiceRequest.user_id]", cascade="all, delete-orphan")
    verification_tokens: Mapped[List["VerificationToken"]] = relationship("VerificationToken", back_populates="user", cascade="all, delete-orphan")
    announcements: Mapped[List["Announcement"]] = relationship("Announcement", back_populates="author")

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
