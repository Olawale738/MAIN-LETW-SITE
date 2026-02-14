"""
Pydantic schemas for Counselling module.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from models.counselling import CounsellingStatus


class CounsellingCreate(BaseModel):
    """Schema for creating a counselling request."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    message: str = Field(..., min_length=10)


class CounsellingReply(BaseModel):
    """Schema for replying to a counselling request."""
    subject: str = Field(..., min_length=5)
    message: str = Field(..., min_length=10)


class CounsellingUpdate(BaseModel):
    """Schema for updating a counselling request."""
    status: Optional[CounsellingStatus] = None
    admin_notes: Optional[str] = None
    is_read: Optional[bool] = None


class CounsellingResponse(BaseModel):
    """Schema for returning a counselling request."""
    id: str
    name: str
    email: EmailStr
    message: str
    status: CounsellingStatus
    admin_notes: Optional[str] = None
    is_read: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CounsellingListResponse(BaseModel):
    """Schema for returning a list of counselling requests."""
    items: list[CounsellingResponse]
    total: int
