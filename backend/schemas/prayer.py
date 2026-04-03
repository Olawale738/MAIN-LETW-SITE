"""
Pydantic schemas for prayer management
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Prayer Category Schemas
class PrayerCategoryBase(BaseModel):
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class PrayerCategoryCreate(PrayerCategoryBase):
    pass


class PrayerCategoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class PrayerCategoryResponse(PrayerCategoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Prayer Schedule Schemas
class PrayerScheduleBase(BaseModel):
    program_name: str
    time_description: str
    description: Optional[str] = None
    icon: Optional[str] = None
    meeting_link: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class PrayerScheduleCreate(PrayerScheduleBase):
    pass


class PrayerScheduleUpdate(BaseModel):
    program_name: Optional[str] = None
    time_description: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    meeting_link: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class PrayerScheduleResponse(PrayerScheduleBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Prayer Stat Schemas
class PrayerStatBase(BaseModel):
    label: str
    value: str
    order_index: int = 0
    is_active: bool = True


class PrayerStatCreate(PrayerStatBase):
    pass


class PrayerStatUpdate(BaseModel):
    label: Optional[str] = None
    value: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class PrayerStatResponse(PrayerStatBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Prayer Request Schemas
class PrayerRequestBase(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    is_anonymous: bool = False
    is_public: bool = True


class PrayerRequestCreate(PrayerRequestBase):
    pass


class PrayerRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_anonymous: Optional[bool] = None
    is_public: Optional[bool] = None
    status: Optional[str] = None
    testimony: Optional[str] = None


class PrayerRequestResponse(PrayerRequestBase):
    id: str
    user_id: str
    status: str
    prayer_count: int
    testimony: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Prayer Page Settings Schemas
class PrayerPageSettingsUpdate(BaseModel):
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_description: Optional[str] = None
    hero_image_url: Optional[str] = None
    scripture_text: Optional[str] = None
    scripture_reference: Optional[str] = None


    call_to_action_text: Optional[str] = None
    live_prayer_link: Optional[str] = None


class PrayerPageSettingsResponse(BaseModel):
    id: str
    hero_title: str
    hero_subtitle: str
    hero_description: str
    hero_image_url: Optional[str] = None
    scripture_text: str
    scripture_reference: str
    call_to_action_text: str
    live_prayer_link: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


# Aggregated response for the prayer page
class PrayerPageData(BaseModel):
    """Complete data for rendering the prayer page"""
    settings: PrayerPageSettingsResponse
    categories: List[PrayerCategoryResponse]
    schedules: List[PrayerScheduleResponse]
    stats: List[PrayerStatResponse]
