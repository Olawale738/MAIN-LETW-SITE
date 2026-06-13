"""Pydantic schemas for YouthProgram."""

from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class YouthProgramBase(BaseModel):
    slug: str
    title: str
    badge: Optional[str] = None
    icon: Optional[str] = None
    color_class: Optional[str] = None
    hero_image_url: Optional[str] = None
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    what_youll_do: Optional[List[Any]] = None
    who_its_for: Optional[List[Any]] = None
    schedule: Optional[List[Any]] = None
    outcomes: Optional[List[Any]] = None
    resources: Optional[List[Any]] = None
    announcements: Optional[List[Any]] = None
    leader_name: Optional[str] = None
    leader_role: Optional[str] = None
    leader_photo_url: Optional[str] = None
    leader_bio: Optional[str] = None
    coordinator_user_ids: Optional[List[str]] = None
    registration_open: bool = True
    join_cta_text: Optional[str] = None
    service_request_label: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class YouthProgramCreate(YouthProgramBase):
    pass


class YouthProgramUpdate(BaseModel):
    title: Optional[str] = None
    badge: Optional[str] = None
    icon: Optional[str] = None
    color_class: Optional[str] = None
    hero_image_url: Optional[str] = None
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    what_youll_do: Optional[List[Any]] = None
    who_its_for: Optional[List[Any]] = None
    schedule: Optional[List[Any]] = None
    outcomes: Optional[List[Any]] = None
    resources: Optional[List[Any]] = None
    announcements: Optional[List[Any]] = None
    leader_name: Optional[str] = None
    leader_role: Optional[str] = None
    leader_photo_url: Optional[str] = None
    leader_bio: Optional[str] = None
    coordinator_user_ids: Optional[List[str]] = None
    registration_open: Optional[bool] = None
    join_cta_text: Optional[str] = None
    service_request_label: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class YouthProgramResponse(YouthProgramBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
