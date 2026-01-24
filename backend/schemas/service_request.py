"""
Pydantic schemas for service request endpoints.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from models.service_request import ServiceRequestStatus


# ============= Request Schemas =============

class ServiceRequestCreate(BaseModel):
    """Request schema for creating service requests."""
    services: list[str] = Field(..., min_length=1, description="List of services to request")
    message: Optional[str] = Field(None, description="Optional message for the request")


class ServiceRequestAction(BaseModel):
    """Request schema for admin approving/rejecting a service request."""
    note: Optional[str] = Field(None, max_length=500, description="Optional note from admin")


# ============= Response Schemas =============

class ServiceRequestResponse(BaseModel):
    """Response schema for a single service request."""
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    service_name: str
    message: Optional[str] = None
    status: ServiceRequestStatus
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    admin_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ServiceRequestListResponse(BaseModel):
    """Response schema for list of service requests."""
    requests: list[ServiceRequestResponse]
    total: int


class MyServiceRequestsResponse(BaseModel):
    """Response schema for user's own service requests with status breakdown."""
    pending: list[ServiceRequestResponse]
    approved: list[ServiceRequestResponse]
    rejected: list[ServiceRequestResponse]
