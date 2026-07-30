"""
Integration settings — single-row store for partner-system secrets so an admin
can manage them from the dashboard instead of server env vars.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class IntegrationSettings(Base):
    __tablename__ = "integration_settings"

    # Fixed single row.
    id: Mapped[str] = mapped_column(String(20), primary_key=True, default="default")
    sharepoints_api_key: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
