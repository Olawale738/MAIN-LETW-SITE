"""
Pydantic schemas for Leadership Training endpoints.
"""

from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from typing import Optional, List
from enum import Enum


class ContentType(str, Enum):
    VIDEO = "video"
    DOCUMENT = "document"


# ============= Request Schemas =============

class ModuleCreate(BaseModel):
    """Request schema for creating a module."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    order_index: int = Field(default=0, ge=0)
    is_published: bool = False


class ModuleUpdate(BaseModel):
    """Request schema for updating a module."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=0)
    is_published: Optional[bool] = None


class VideoContentCreate(BaseModel):
    """Request schema for adding video content."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    youtube_url: str = Field(..., min_length=1)
    order_index: int = Field(default=0, ge=0)


class DocumentContentCreate(BaseModel):
    """Request schema for document content metadata (file uploaded separately)."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    order_index: int = Field(default=0, ge=0)


# ============= Response Schemas =============

class ContentResponse(BaseModel):
    """Response schema for a content item."""
    id: str
    module_id: str
    content_type: str
    title: str
    description: Optional[str] = None
    youtube_url: Optional[str] = None
    youtube_thumbnail: Optional[str] = None  # Computed field
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True


class ModuleResponse(BaseModel):
    """Response schema for a module."""
    id: str
    title: str
    description: Optional[str] = None
    order_index: int
    is_published: bool
    created_at: datetime
    contents: List[ContentResponse] = []

    class Config:
        from_attributes = True


class ModuleListResponse(BaseModel):
    """Response schema for list of modules."""
    modules: List[ModuleResponse]
    total: int


class ModuleSummaryResponse(BaseModel):
    """Response schema for module summary (without contents)."""
    id: str
    title: str
    description: Optional[str] = None
    order_index: int
    is_published: bool
    content_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
