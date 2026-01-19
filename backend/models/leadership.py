"""
Leadership Training database models.
Stores modules and content (videos/documents) for the Leadership program.
"""

import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean, Integer, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base


class ContentType(str, Enum):
    """Type of content in a module."""
    VIDEO = "video"
    DOCUMENT = "document"


class LeadershipModule(Base):
    """Model for Leadership Training modules."""
    
    __tablename__ = "leadership_modules"
    
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
    
    order_index: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    # Relationships
    contents = relationship(
        "LeadershipContent",
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="LeadershipContent.order_index"
    )
    
    def __repr__(self) -> str:
        return f"<LeadershipModule {self.title}>"


class LeadershipContent(Base):
    """Model for content items within a Leadership module."""
    
    __tablename__ = "leadership_contents"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    module_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("leadership_modules.id", ondelete="CASCADE"),
        nullable=False
    )
    
    content_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    description: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )
    
    # For video content
    youtube_url: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    
    # For document content - stored as binary in database
    file_data: Mapped[bytes] = mapped_column(
        LargeBinary,
        nullable=True
    )
    
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )
    
    file_mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=True
    )
    
    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=True
    )
    
    order_index: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    # Relationships
    module = relationship("LeadershipModule", back_populates="contents")
    
    def __repr__(self) -> str:
        return f"<LeadershipContent {self.title} ({self.content_type})>"
