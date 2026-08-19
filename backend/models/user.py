"""
User database model.
"""

import uuid
import enum
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Enum as SQLEnum, JSON, Text
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
    from models.message import Conversation
    from models.department import DepartmentMember


class UserStatus(str, enum.Enum):
    """User account status."""
    PENDING = "pending"      # Email not verified
    ACTIVE = "active"        # Email verified, password set
    SUSPENDED = "suspended"  # Account suspended


class UserRole(str, enum.Enum):
    """User role."""
    USER                   = "user"
    ADMIN                  = "admin"
    MODERATOR              = "moderator"
    # Deputy admins: admin-appointed seconds-in-command. They see the admin
    # dashboard but only the sections the admin explicitly grants (scopes).
    DEPUTY_ADMIN_1         = "deputy_admin_1"
    DEPUTY_ADMIN_2         = "deputy_admin_2"
    DEPUTY_ADMIN_3         = "deputy_admin_3"
    CHOIRMASTER            = "choirmaster"
    YOUTH_LEADER           = "youth_leader"
    CHILDREN_COORDINATOR   = "children_coordinator"
    MENTOR                 = "mentor"
    VOLUNTEER_COORDINATOR  = "volunteer_coordinator"
    EVANGELISM_COORDINATOR = "evangelism_coordinator"


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
        SQLEnum(UserRole, native_enum=False),
        default=UserRole.USER,
        nullable=False
    )

    status: Mapped[UserStatus] = mapped_column(
        SQLEnum(UserStatus, native_enum=False),
        default=UserStatus.PENDING,
        nullable=False
    )

    services: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False
    )

    # ----- Profile fields (added for user dashboard) -----
    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    phone: Mapped[str | None] = mapped_column(
        String(40),
        nullable=True,
    )
    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    # ISO 3166-1 alpha-2 country code (e.g. NG, US, GB). Captured at signup so
    # admins can segment members by country/continent.
    country_code: Mapped[str | None] = mapped_column(
        String(2),
        nullable=True,
        index=True,
    )
    country_name: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )
    continent: Mapped[str | None] = mapped_column(
        String(40),
        nullable=True,
        index=True,
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

    # Chat relationships
    conversations_as_user: Mapped[List["Conversation"]] = relationship(
        "Conversation",
        foreign_keys="[Conversation.user_id]",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    conversations_as_admin: Mapped[List["Conversation"]] = relationship(
        "Conversation",
        foreign_keys="[Conversation.admin_id]",
        back_populates="admin",
    )

    # Department memberships
    department_memberships: Mapped[List["DepartmentMember"]] = relationship(
        "DepartmentMember", back_populates="user", cascade="all, delete-orphan",
        foreign_keys="[DepartmentMember.user_id]"
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
