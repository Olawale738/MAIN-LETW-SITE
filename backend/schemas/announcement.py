"""
Pydantic schemas for announcement endpoints.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ============= Request Schemas =============

class AnnouncementCreate(BaseModel):
    """Request schema for creating an announcement."""
    service_name: str = Field(..., min_length=1, max_length=255)
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)


# ============= Response Schemas =============

class AnnouncementResponse(BaseModel):
    """Response schema for a single announcement."""
    id: str
    service_name: str
    title: str
    content: str
    created_by: Optional[str] = None
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class AnnouncementListResponse(BaseModel):
    """Response schema for list of announcements."""
    announcements: list[AnnouncementResponse]
    total: int
