"""
Bible Study schemas for API validation
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from models.bible_study import ReadingPlanType, ReadingStatus


# Reading Plan Schemas
class BibleReadingPlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    plan_type: ReadingPlanType = ReadingPlanType.WEEKLY
    duration_days: int
    target_audience: Optional[str] = None
    is_featured: bool = False
    is_active: bool = True
    order_index: int = 0


class BibleReadingPlanCreate(BibleReadingPlanBase):
    pass


class BibleReadingPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    plan_type: Optional[ReadingPlanType] = None
    duration_days: Optional[int] = None
    target_audience: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    order_index: Optional[int] = None


class BibleReadingPlanResponse(BibleReadingPlanBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Daily Reading Schemas
class DailyReadingBase(BaseModel):
    day_number: int
    title: str
    scripture_reference: str
    reflection: Optional[str] = None
    key_verse: Optional[str] = None


class DailyReadingCreate(DailyReadingBase):
    plan_id: str


class DailyReadingUpdate(BaseModel):
    day_number: Optional[int] = None
    title: Optional[str] = None
    scripture_reference: Optional[str] = None
    reflection: Optional[str] = None
    key_verse: Optional[str] = None


class DailyReadingResponse(DailyReadingBase):
    id: str
    plan_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# User Progress Schemas
class UserReadingProgressBase(BaseModel):
    plan_id: str
    start_date: date


class UserReadingProgressCreate(UserReadingProgressBase):
    pass


class UserReadingProgressUpdate(BaseModel):
    current_day: Optional[int] = None
    is_active: Optional[bool] = None


class UserReadingProgressResponse(BaseModel):
    id: str
    user_id: str
    plan_id: str
    start_date: date
    current_day: int
    completed_days: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# User Daily Reading Schemas
class UserDailyReadingBase(BaseModel):
    daily_reading_id: str
    status: ReadingStatus = ReadingStatus.NOT_STARTED
    notes: Optional[str] = None


class UserDailyReadingCreate(UserDailyReadingBase):
    pass


class UserDailyReadingUpdate(BaseModel):
    status: Optional[ReadingStatus] = None
    notes: Optional[str] = None


class UserDailyReadingResponse(UserDailyReadingBase):
    id: str
    progress_id: str
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Bible Study Resource Schemas
class BibleStudyResourceBase(BaseModel):
    title: str
    description: Optional[str] = None
    resource_type: str  # "video", "pdf", "article", "audio"
    resource_url: Optional[str] = None
    category: Optional[str] = None
    is_featured: bool = False
    is_active: bool = True
    order_index: int = 0


class BibleStudyResourceCreate(BibleStudyResourceBase):
    pass


class BibleStudyResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    resource_type: Optional[str] = None
    resource_url: Optional[str] = None
    category: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    order_index: Optional[int] = None


class BibleStudyResourceResponse(BibleStudyResourceBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Page Settings Schemas
class BibleStudyPageSettingsUpdate(BaseModel):
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_description: Optional[str] = None
    hero_background_url: Optional[str] = None


class BibleStudyPageSettingsResponse(BaseModel):
    id: str
    hero_title: str
    hero_subtitle: str
    hero_description: str
    hero_background_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Aggregated response for user-facing page
class BibleStudyPageData(BaseModel):
    settings: BibleStudyPageSettingsResponse
    featured_plans: List[BibleReadingPlanResponse]
    all_plans: List[BibleReadingPlanResponse]
    featured_resources: List[BibleStudyResourceResponse]


# Detailed plan with readings
class BibleReadingPlanWithReadings(BibleReadingPlanResponse):
    readings: List[DailyReadingResponse]


# User progress with details
class UserProgressWithDetails(UserReadingProgressResponse):
    plan: BibleReadingPlanResponse
    daily_readings: List[UserDailyReadingResponse]

