"""
Sanctuary / hall booking.

Two tables:
  - sanctuary_rooms    — bookable spaces (wedding hall, prayer chapel, etc.)
  - sanctuary_bookings — requests against a room for a date/time window.
"""

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import String, DateTime, Integer, Text, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class SanctuaryRoom(Base):
    __tablename__ = "sanctuary_rooms"

    id:          Mapped[str]  = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name:        Mapped[str]  = mapped_column(String(120), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    capacity:    Mapped[int]  = mapped_column(Integer, default=0, nullable=False)
    location:    Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    image_url:   Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    equipment:   Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)  # ["projector","aircon",...]
    rate_note:   Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Structured booking fee. price 0 (or null) = free; anything above requires payment.
    price:       Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    currency:    Mapped[str]  = mapped_column(String(10), default="NGN", nullable=False)
    is_active:   Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order:  Mapped[int]  = mapped_column(Integer, default=0, nullable=False)
    created_at:  Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class SanctuaryBooking(Base):
    __tablename__ = "sanctuary_bookings"

    id:           Mapped[str]  = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id:      Mapped[str]  = mapped_column(String(36), ForeignKey("sanctuary_rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    purpose:      Mapped[str]  = mapped_column(String(255), nullable=False)
    contact_name: Mapped[str]  = mapped_column(String(150), nullable=False)
    contact_email:Mapped[str]  = mapped_column(String(255), nullable=False)
    contact_phone:Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    starts_at:    Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    ends_at:      Mapped[datetime] = mapped_column(DateTime, nullable=False)
    attendees:    Mapped[int]  = mapped_column(Integer, default=0, nullable=False)
    note:         Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status:       Mapped[str]  = mapped_column(String(20), default="requested", nullable=False, index=True)  # requested|approved|declined|cancelled
    admin_note:   Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Payment (set when the room has a price). payment_status: unpaid|paid|waived.
    amount:           Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    currency:         Mapped[str]  = mapped_column(String(10), default="NGN", nullable=False)
    payment_status:   Mapped[str]  = mapped_column(String(20), default="unpaid", nullable=False, index=True)
    payment_reference: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, index=True)
    paid_at:          Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at:   Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
