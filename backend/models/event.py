"""
Event database model.
Stores church events with date, time, location, and registration.
"""

import uuid
from datetime import datetime, date, time
from sqlalchemy import String, DateTime, Date, Time, Text, Boolean, Integer, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from database import Base


class Event(Base):
    """Model for church events."""
    
    __tablename__ = "events"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    description: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )
    
    event_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )
    
    start_time: Mapped[str] = mapped_column(
        String(10),  # Store as "HH:MM"
        nullable=True
    )
    
    end_time: Mapped[str] = mapped_column(
        String(10),
        nullable=True
    )
    
    location: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    
    event_type: Mapped[str] = mapped_column(
        String(100),
        default="General",
        nullable=False
    )
    
    # Image stored in database
    image_data: Mapped[bytes] = mapped_column(
        LargeBinary,
        nullable=True
    )
    
    image_mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=True
    )
    
    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    registration_required: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    registration_link: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    
    max_attendees: Mapped[int] = mapped_column(
        Integer,
        nullable=True
    )
    
    registered_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    def __repr__(self) -> str:
        return f"<Event {self.title} on {self.event_date}>"
