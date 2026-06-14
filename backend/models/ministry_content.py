"""
MinistryContent — one row per flagship ministry page (women, men).
Holds every editable section (hero, carousel, pillars, programs,
scripture, join form copy, footer) inside a single JSONB blob.
Admin can edit every word without touching code.
"""

from datetime import datetime
from typing import Any, Optional
from sqlalchemy import String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class MinistryContent(Base):
    __tablename__ = "ministry_content"

    key: Mapped[str] = mapped_column(String(20), primary_key=True)  # 'women' | 'men'
    content: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
