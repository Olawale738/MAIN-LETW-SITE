"""
DailyVerse — admin-curated scripture rotation. One verse is featured per day
based on day-of-year modulo the count of active verses, so the rotation is
deterministic and identical for every visitor on the same day.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class DailyVerse(Base):
    __tablename__ = "daily_verses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference: Mapped[str] = mapped_column(String(120), nullable=False)   # "John 3:16"
    text: Mapped[str] = mapped_column(Text, nullable=False)
    translation: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)  # "KJV", "NIV", "ESV"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
