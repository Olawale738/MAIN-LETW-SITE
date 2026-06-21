"""
Small Groups / House Fellowships — discoverable groups members can join.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, ForeignKey, Boolean, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class SmallGroup(Base):
    __tablename__ = "small_groups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Optional topical tags, comma-separated
    topics: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # Stage of life this group is best for: any | newcomers | young_adults | couples | families | seniors | men | women | students
    audience: Mapped[str] = mapped_column(String(40), default="any", nullable=False, index=True)

    # When + where
    # 0=Sunday ... 6=Saturday
    day_of_week: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    time_text: Mapped[str] = mapped_column(String(60), default="6:00 PM")
    cadence: Mapped[str] = mapped_column(String(20), default="weekly")  # weekly | biweekly | monthly

    location_label: Mapped[str] = mapped_column(String(255), default="See group leader for address")
    city: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, index=True)
    country: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, index=True)
    # Approximate coordinates so we can render a map later
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    leader_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    leader_name: Mapped[str] = mapped_column(String(200), default="LETW Leader")
    leader_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    capacity: Mapped[int] = mapped_column(Integer, default=12, nullable=False)
    current_size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class SmallGroupInterest(Base):
    """A request to join a particular group."""
    __tablename__ = "small_group_interests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("small_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    requester_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    requester_name: Mapped[str] = mapped_column(String(200), nullable=False)
    requester_email: Mapped[str] = mapped_column(String(200), nullable=False)
    requester_phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending | contacted | accepted | declined
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
