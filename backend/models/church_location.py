"""
Church locations — headquarters, branches, and missions around the world.
Captured by admin and rendered on the public 'Worldwide Reach' map.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, Boolean, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


# hq | branch | mission | fellowship
KINDS = ("hq", "branch", "mission", "fellowship")


class ChurchLocation(Base):
    __tablename__ = "church_locations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    kind: Mapped[str] = mapped_column(String(20), default="branch", nullable=False, index=True)

    continent: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    country_name: Mapped[str] = mapped_column(String(120), nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)

    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    blurb: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    contact_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # SVG-space coordinates for the map (1000x500 viewBox)
    map_x: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    map_y: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # Real-world lat/lng for the future
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
