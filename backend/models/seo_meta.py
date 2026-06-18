"""
Per-page SEO meta — admin sets title, description, OG card image, robots.
Pages look up by slug (e.g. 'home', 'about', 'give', 'theology-school').
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class SeoMeta(Base):
    __tablename__ = "seo_meta"

    slug: Mapped[str] = mapped_column(String(120), primary_key=True)
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    og_title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    og_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    og_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    canonical_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    robots: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)  # e.g. 'index,follow'
    keywords: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
