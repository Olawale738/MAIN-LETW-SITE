"""
Custom Ministry Models
Allows admins to dynamically create new ministries beyond the hardcoded
department types. Examples: Women's Ministry, Men's Fellowship, Marriage
Ministry, Singles Ministry, Seniors Ministry, etc.

Each ministry gets:
- A public landing page (auto-generated)
- A coordinator dashboard
- Member request/approval workflow
- Group messaging
- Announcements & activities
"""

import uuid
import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String, DateTime, Boolean, Text, ForeignKey, JSON, UniqueConstraint, Integer
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base

if TYPE_CHECKING:
    from models.user import User


class MinistryMembershipStatus(str, enum.Enum):
    """Member status in a custom ministry."""
    PENDING   = "pending"      # Awaiting coordinator/admin approval
    ACTIVE    = "active"       # Approved active member
    SUSPENDED = "suspended"    # Temporarily suspended
    REJECTED  = "rejected"     # Application rejected


class CustomMinistry(Base):
    """
    Admin-created ministry (e.g., Women's Ministry, Men's Fellowship).
    Distinct from the hardcoded departments (Choir, Youth, Children, etc.).
    """
    __tablename__ = "custom_ministries"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_ministry_slug"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # URL-safe identifier (e.g., "womens-ministry", "marriage-ministry")
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # Display name (e.g., "Women's Ministry")
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # Short tagline (e.g., "Empowering women in faith")
    tagline: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    # Full description / about section
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Hero image URL (for the landing page)
    hero_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # Logo/icon URL
    icon_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # Theme color (hex, e.g., "#dc2626")
    color: Mapped[str] = mapped_column(String(20), default="#140152")
    # Secondary color for gradients
    secondary_color: Mapped[str] = mapped_column(String(20), default="#7c3aed")
    # Lucide icon name (e.g., "Heart", "Users", "Crown")
    icon_name: Mapped[str] = mapped_column(String(50), default="Users")
    # Emoji for visual identity (e.g., "🌸", "💍", "👑")
    emoji: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    # Is the ministry visible to the public?
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Can new members request to join?
    accepts_members: Mapped[bool] = mapped_column(Boolean, default=True)
    # Meeting schedule (free-text, e.g., "Every Saturday 5pm")
    meeting_schedule: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    # Location (optional)
    location: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    # Custom features as JSON (e.g., {"prayer_chain": true, "events": true})
    features: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Sort order for display
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    # Admin who created this
    created_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CustomMinistryMember(Base):
    """
    Membership of a user in a custom ministry.
    Supports pending, active, suspended, and rejected statuses.
    """
    __tablename__ = "custom_ministry_members"
    __table_args__ = (
        UniqueConstraint("ministry_id", "user_id", name="uq_ministry_member"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    status: Mapped[MinistryMembershipStatus] = mapped_column(
        String(20), default=MinistryMembershipStatus.PENDING
    )
    # Coordinator role within this ministry
    is_coordinator: Mapped[bool] = mapped_column(Boolean, default=False)
    # Role label (e.g., "Treasurer", "Secretary", "Vice-Chair")
    role_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # User's stated reason for joining
    join_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Admin notes about this member
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    approved_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class CustomMinistryAnnouncement(Base):
    """Announcements posted to a custom ministry."""
    __tablename__ = "custom_ministry_announcements"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryMessage(Base):
    """Group chat messages within a custom ministry."""
    __tablename__ = "custom_ministry_messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    sender_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
