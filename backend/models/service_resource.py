"""
Service Resource database model.
Stores admin-managed downloadable files and links for service pages.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Boolean, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from database import Base


class ServiceResourceType(str, enum.Enum):
    FILE = "file"
    LINK = "link"
    PAGE = "page"


class ServiceResource(Base):
    """Model for admin-controlled service resources (bulletins, notes, links)."""

    __tablename__ = "service_resources"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )

    icon: Mapped[str] = mapped_column(
        String(100),
        nullable=True,
        default="FileText"
    )

    resource_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ServiceResourceType.LINK.value
    )

    file_url: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )

    external_url: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )

    service_slug: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        default="sunday-service"
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    display_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
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
        nullable=True
    )

    def __repr__(self) -> str:
        return f"<ServiceResource {self.title} ({self.resource_type})>"
