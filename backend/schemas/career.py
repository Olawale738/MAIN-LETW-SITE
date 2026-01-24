"""
Pydantic schemas for Career Guidance API.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ============= Base Schemas =============

class CareerModuleBase(BaseModel):
    """Base schema for career modules."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    icon: Optional[str] = None
    order_index: int = Field(default=0, ge=0)
    is_published: bool = False


class CareerResourceBase(BaseModel):
    """Base schema for career resources."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    resource_type: str = Field(..., pattern="^(pdf|video|article|link)$")
    file_url: Optional[str] = None
    video_url: Optional[str] = None
    article_content: Optional[str] = None
    external_link: Optional[str] = None
    order_index: int = Field(default=0, ge=0)


class CareerSessionBase(BaseModel):
    """Base schema for career sessions."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    session_date: datetime
    duration_minutes: int = Field(default=60, ge=15, le=240)
    meeting_link: Optional[str] = None
    status: str = Field(default="scheduled", pattern="^(scheduled|completed|cancelled|rescheduled)$")
    notes: Optional[str] = None


class CareerTaskBase(BaseModel):
    """Base schema for career tasks."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    order_index: int = Field(default=0, ge=0)


# ============= Create Schemas =============

class CareerModuleCreate(CareerModuleBase):
    """Schema for creating a career module."""
    pass


class CareerResourceCreate(CareerResourceBase):
    """Schema for creating a career resource."""
    pass


class CareerSessionCreate(CareerSessionBase):
    """Schema for creating a career session."""
    user_id: str


class CareerTaskCreate(CareerTaskBase):
    """Schema for creating a career task."""
    pass


# ============= Update Schemas =============

class CareerModuleUpdate(BaseModel):
    """Schema for updating a career module."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    icon: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=0)
    is_published: Optional[bool] = None


class CareerSessionUpdate(BaseModel):
    """Schema for updating a career session."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    session_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=240)
    meeting_link: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(scheduled|completed|cancelled|rescheduled)$")
    notes: Optional[str] = None


# ============= Response Schemas =============

class CareerResourceResponse(CareerResourceBase):
    """Response schema for a career resource."""
    id: str
    module_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class CareerTaskResponse(CareerTaskBase):
    """Response schema for a career task."""
    id: str
    module_id: str
    created_at: datetime
    is_completed: bool = False  # Will be populated based on user progress
    
    class Config:
        from_attributes = True


class CareerModuleResponse(CareerModuleBase):
    """Response schema for a career module with resources and tasks."""
    id: str
    created_at: datetime
    updated_at: datetime
    resources: List[CareerResourceResponse] = []
    tasks: List[CareerTaskResponse] = []
    progress_percent: int = 0  # Will be populated based on user progress
    
    class Config:
        from_attributes = True


class CareerModuleListResponse(BaseModel):
    """Response schema for career module list."""
    id: str
    title: str
    description: Optional[str]
    icon: Optional[str]
    order_index: int
    is_published: bool
    created_at: datetime
    progress_percent: int = 0
    
    class Config:
        from_attributes = True


class CareerSessionResponse(CareerSessionBase):
    """Response schema for a career session."""
    id: str
    user_id: str
    created_at: datetime
    user_name: Optional[str] = None  # Populated from user relationship
    
    class Config:
        from_attributes = True


class UserCareerDashboard(BaseModel):
    """Response schema for user career dashboard."""
    current_focus: Optional[str] = None
    next_session: Optional[CareerSessionResponse] = None
    overall_progress: int = 0
    modules: List[CareerModuleListResponse] = []
    pending_tasks: List[CareerTaskResponse] = []

