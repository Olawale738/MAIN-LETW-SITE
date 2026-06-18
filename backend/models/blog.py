"""
Blog post / pastor's column — short-form posts with rich HTML body.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    excerpt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    hero_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    author_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author_name: Mapped[str] = mapped_column(String(200), nullable=False, default="Pastor")
    tags: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)  # draft | published
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
