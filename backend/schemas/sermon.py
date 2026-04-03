"""
Pydantic schemas for Sermon endpoints.
"""

from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List


# ============= Request Schemas =============

class SermonCreate(BaseModel):
    """Request schema for creating a sermon (JSON part)."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    preacher: str = Field(..., min_length=1, max_length=255)
    sermon_date: date
    series: Optional[str] = Field(None, max_length=255)
    video_url: Optional[str] = None
    is_featured: bool = False
    is_published: bool = True


class SermonUpdate(BaseModel):
    """Request schema for updating a sermon."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    preacher: Optional[str] = Field(None, min_length=1, max_length=255)
    sermon_date: Optional[date] = None
    series: Optional[str] = None
    video_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None


# ============= Response Schemas =============

class SermonResponse(BaseModel):
    """Response schema for a sermon."""
    id: str
    title: str
    description: Optional[str] = None
    preacher: str
    sermon_date: date
    series: Optional[str] = None
    video_url: Optional[str] = None
    video_thumbnail: Optional[str] = None  # Computed from YouTube URL
    has_audio: bool = False
    audio_filename: Optional[str] = None
    audio_size: Optional[int] = None
    has_document: bool = False
    document_filename: Optional[str] = None
    document_size: Optional[int] = None
    has_thumbnail: bool = False
    is_featured: bool
    is_published: bool
    view_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class SermonListResponse(BaseModel):
    """Response schema for list of sermons."""
    sermons: List[SermonResponse]
    total: int


class SermonSummary(BaseModel):
    """Simplified sermon for lists (without binary data info)."""
    id: str
    title: str
    preacher: str
    sermon_date: date
    series: Optional[str] = None
    video_thumbnail: Optional[str] = None
    is_featured: bool
    view_count: int

    class Config:
        from_attributes = True
