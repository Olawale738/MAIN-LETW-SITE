"""
Social Media Auto-Poster — credentials per platform + post log.

Supported natively:
- Twitter (X) — POST /2/tweets with Bearer token
- Facebook page — POST /{page_id}/feed with Page access token

Instagram requires a Facebook Business linked IG account + media container
flow; left as a future addition (admin can still 'queue' posts for manual).
"""

from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, DateTime, Boolean, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class SocialPostTarget(Base):
    __tablename__ = "social_post_targets"
    __table_args__ = (UniqueConstraint("platform", name="uq_social_platform"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    platform: Mapped[str] = mapped_column(String(40), nullable=False)  # 'twitter' | 'facebook' | 'instagram'
    display_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_id: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    account_id: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_post_sermons: Mapped[bool] = mapped_column(Boolean, default=False)
    config: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SocialPost(Base):
    __tablename__ = "social_posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    platform: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    source_kind: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)  # 'sermon' | 'event' | 'manual'
    source_id: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    media_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending/posted/failed
    external_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    posted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
