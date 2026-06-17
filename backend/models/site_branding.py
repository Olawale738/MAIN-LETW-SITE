"""
SiteBranding — single-row table storing the current logo + favicon paths.
Admin uploads files; this row points at them.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class SiteBranding(Base):
    __tablename__ = "site_branding"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    logo_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    favicon_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
