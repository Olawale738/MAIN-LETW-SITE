"""
Pydantic schemas for service resource endpoints.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ============= Request Schemas =============

class ServiceResourceCreate(BaseModel):
    """Request schema for creating a service resource."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    icon: Optional[str] = "FileText"
    resource_type: str = Field(default="link", pattern="^(file|link|page)$")
    file_url: Optional[str] = None
    external_url: Optional[str] = None
    service_slug: str = Field(default="sunday-service", min_length=1, max_length=100)
    is_active: bool = True
    display_order: int = 0


class ServiceResourceUpdate(BaseModel):
    """Request schema for updating a service resource."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    icon: Optional[str] = None
    resource_type: Optional[str] = Field(None, pattern="^(file|link|page)$")
    file_url: Optional[str] = None
    external_url: Optional[str] = None
    service_slug: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


# ============= Response Schemas =============

class ServiceResourceResponse(BaseModel):
    """Response schema for a single service resource."""
    id: str
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    resource_type: str
    file_url: Optional[str] = None
    external_url: Optional[str] = None
    service_slug: str
    is_active: bool
    display_order: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ServiceResourceListResponse(BaseModel):
    """Response schema for list of service resources."""
    resources: list[ServiceResourceResponse]
    total: int
