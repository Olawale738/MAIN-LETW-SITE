"""
Pydantic schemas for testimony management
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TestimonyCreate(BaseModel):
    """Schema for submitting a new testimony (public, no auth)"""
    name: str
    email: str
    testimony_text: str


class TestimonyUpdate(BaseModel):
    """Schema for admin updating a testimony (status change)"""
    status: Optional[str] = None


class TestimonyResponse(BaseModel):
    """Schema for testimony in API responses"""
    id: str
    name: str
    email: str
    testimony_text: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
