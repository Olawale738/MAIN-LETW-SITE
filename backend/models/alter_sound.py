"""
Alter Sound models for audio worship content management
"""
import uuid
import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class AudioCategory(Base):
    """Categories for organizing audio content"""
    __tablename__ = "audio_categories"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Lucide icon name
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audio_tracks: Mapped[List["AudioTrack"]] = relationship("AudioTrack", back_populates="category", cascade="all, delete-orphan")


class AudioTrack(Base):
    """Audio tracks for worship, prophetic sound, etc."""
    __tablename__ = "audio_tracks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("audio_categories.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    artist: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    duration: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # e.g., "3:45"

    # Audio file stored in database
    audio_data: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    audio_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    audio_mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    audio_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Cover image stored in database
    cover_image_data: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    cover_image_mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    play_count: Mapped[int] = mapped_column(Integer, default=0)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category: Mapped["AudioCategory"] = relationship("AudioCategory", back_populates="audio_tracks")


class AlterSoundPageSettings(Base):
    """Settings for the Alter Sound page"""
    __tablename__ = "alter_sound_page_settings"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Hero Section
    hero_title: Mapped[str] = mapped_column(String(255), default="Raising Sound That")
    hero_subtitle: Mapped[str] = mapped_column(String(255), default="Carries Heaven's Intention")
    hero_description: Mapped[str] = mapped_column(Text, default="Not entertainment. A consecrated space where worship, prophetic sound, and spiritual alignment converge to release God's presence.")
    hero_background_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Section Titles
    featured_section_title: Mapped[str] = mapped_column(String(255), default="Featured Worship")
    categories_section_title: Mapped[str] = mapped_column(String(255), default="Explore by Category")
    
    # Call to Action
    cta_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cta_button_text: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cta_button_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

