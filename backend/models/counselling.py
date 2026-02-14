"""
Counselling Request database model.
Tracks confidential counselling requests.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SQLEnum, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from database import Base


class CounsellingStatus(str, enum.Enum):
    """Status of a counselling request."""
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class CounsellingRequest(Base):
    """Model for tracking counselling requests."""
    
    __tablename__ = "counselling_requests"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )
    
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    status: Mapped[CounsellingStatus] = mapped_column(
        SQLEnum(CounsellingStatus),
        default=CounsellingStatus.NEW,
        nullable=False,
        index=True
    )
    
    admin_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
    
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
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
        return f"<CounsellingRequest {self.id} by {self.email} ({self.status})>"
