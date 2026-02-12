"""
Pydantic schemas for kids ministry registration
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr


class KidsMinistryRegistrationCreate(BaseModel):
    child_name: str = Field(..., min_length=1, max_length=255)
    child_age: int = Field(..., ge=2, le=17)
    age_group: str = Field(..., pattern="^(Nursery|Elementary|Youth)$")
    parent_name: str = Field(..., min_length=1, max_length=255)
    parent_email: str = Field(..., min_length=1, max_length=255)
    parent_phone: Optional[str] = None
    special_needs: Optional[str] = None


class KidsMinistryRegistrationUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(pending|approved|declined)$")


class KidsMinistryRegistrationResponse(BaseModel):
    id: str
    child_name: str
    child_age: int
    age_group: str
    parent_name: str
    parent_email: str
    parent_phone: Optional[str] = None
    special_needs: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
