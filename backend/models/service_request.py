"""
Service Request database model.
Tracks user requests to join services, requiring admin approval.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base


class ServiceRequestStatus(str, enum.Enum):
    """Status of a service request."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ServiceRequest(Base):
    """Model for tracking service join requests that require admin approval."""
    
    __tablename__ = "service_requests"
    
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
    
    service_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    status: Mapped[ServiceRequestStatus] = mapped_column(
        SQLEnum(ServiceRequestStatus),
        default=ServiceRequestStatus.PENDING,
        nullable=False,
        index=True
    )
    
    reviewed_by: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    admin_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
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
    user = relationship("User", foreign_keys=[user_id], backref="service_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    
    def __repr__(self) -> str:
        return f"<ServiceRequest {self.service_name} by user {self.user_id} ({self.status})>"
