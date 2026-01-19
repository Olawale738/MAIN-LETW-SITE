"""
Notification database model.
Stores in-app notifications for users.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SQLEnum, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base


class NotificationType(str, enum.Enum):
    """Type of notification."""
    SERVICE_APPROVED = "service_approved"
    SERVICE_REJECTED = "service_rejected"
    NEW_SERVICE_REQUEST = "new_service_request"  # For admins
    ANNOUNCEMENT = "announcement"  # Service announcements from admin
    GENERAL = "general"


class Notification(Base):
    """Model for in-app notifications."""
    
    __tablename__ = "notifications"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    type: Mapped[NotificationType] = mapped_column(
        SQLEnum(NotificationType),
        default=NotificationType.GENERAL,
        nullable=False
    )
    
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    # Optional link to related entity
    reference_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    # Relationships
    user = relationship("User", backref="notifications")
    
    def __repr__(self) -> str:
        return f"<Notification {self.title} for user {self.user_id}>"
