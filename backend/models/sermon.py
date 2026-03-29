"""
Sermon database model.
Stores sermons with support for video URLs, audio, and documents.
"""

import uuid
from datetime import datetime, date
from enum import Enum
from sqlalchemy import String, DateTime, Date, ForeignKey, Text, Boolean, Integer, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base


class SermonMediaType(str, Enum):
    """Type of media attached to sermon."""
    VIDEO = "video"      # YouTube or external video URL
    AUDIO = "audio"      # Audio file stored in database
    DOCUMENT = "document"  # PDF/DOC stored in database


class Sermon(Base):
    """Model for sermons/messages."""
    
    __tablename__ = "sermons"
    
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
    
    preacher: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    sermon_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )
    
    series: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )
    
    # Video URL (YouTube or other)
    video_url: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    
    # Audio file stored in database
    audio_data: Mapped[bytes] = mapped_column(
        LargeBinary,
        nullable=True
    )
    
    audio_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )
    
    audio_mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=True
    )
    
    audio_size: Mapped[int] = mapped_column(
        Integer,
        nullable=True
    )
    
    # Document file stored in database
    document_data: Mapped[bytes] = mapped_column(
        LargeBinary,
        nullable=True
    )
    
    document_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )
    
    document_mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=True
    )
    
    document_size: Mapped[int] = mapped_column(
        Integer,
        nullable=True
    )
    
    # External document URL (alternative to uploading)
    document_url: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    
    # Thumbnail image (optional, stored in database)
    thumbnail_data: Mapped[bytes] = mapped_column(
        LargeBinary,
        nullable=True
    )
    
    thumbnail_mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=True
    )
    
    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    view_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    def __repr__(self) -> str:
        return f"<Sermon {self.title} by {self.preacher}>"
