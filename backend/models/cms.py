"""
CMS database models.
Stores dynamic page content and binary images.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, LargeBinary, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from sqlalchemy.dialects.sqlite import JSON

from database import Base

class CMSPage(Base):
    """Model for dynamic pages (Home, About)."""
    
    __tablename__ = "cms_pages"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    slug: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )
    
    title: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    # Storing content as JSON string for flexibility
    content: Mapped[str] = mapped_column(
        Text, 
        nullable=False,
        default="{}"
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class CMSImage(Base):
    """Model for CMS images stored as binary."""
    
    __tablename__ = "cms_images"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    data: Mapped[bytes] = mapped_column(
        LargeBinary,
        nullable=False
    )
    
    size: Mapped[int] = mapped_column(
        Integer,
        nullable=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
