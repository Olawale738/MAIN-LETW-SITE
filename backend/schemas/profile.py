"""
Schemas for the extended user profile endpoints used by the dashboard.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    """Full profile payload for the dashboard."""
    id: str
    name: str
    email: str
    role: str
    status: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    services: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    """Fields the user may update on their own profile."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    bio: Optional[str] = Field(default=None, max_length=2000)
    phone: Optional[str] = Field(default=None, max_length=40)
    location: Optional[str] = Field(default=None, max_length=255)
    avatar_url: Optional[str] = Field(default=None, max_length=500)


class PasswordChangeRequest(BaseModel):
    """Change-password payload."""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


class ActivityItem(BaseModel):
    """A single row on the activity timeline."""
    kind: str            # "prayer_request" | "service_request" | "bible_progress" | "message" | "announcement"
    title: str
    description: Optional[str] = None
    status: Optional[str] = None
    happened_at: datetime
    link: Optional[str] = None


class ActivityResponse(BaseModel):
    items: List[ActivityItem]
    counts: dict


class PrayerWallItem(BaseModel):
    id: str
    title: str
    description: str
    category: Optional[str] = None
    author_name: str          # "Anonymous" when is_anonymous=True
    is_anonymous: bool
    prayer_count: int
    has_prayed: bool
    status: str
    created_at: datetime


class PrayerWallResponse(BaseModel):
    requests: List[PrayerWallItem]
    total: int


class PrayerWallCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=2, max_length=4000)
    category: Optional[str] = Field(default=None, max_length=100)
    is_anonymous: bool = False
