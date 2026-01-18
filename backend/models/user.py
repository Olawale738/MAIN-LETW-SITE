"""
User database model.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from database import Base


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
    
    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
