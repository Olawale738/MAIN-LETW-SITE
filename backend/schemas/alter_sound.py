"""
Alter Sound Pydantic schemas for API validation
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Audio Category Schemas
class AudioCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class AudioCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class AudioCategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    icon: Optional[str]
    order_index: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Audio Track Schemas
class AudioTrackCreate(BaseModel):
    category_id: str
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    artist: Optional[str] = None
    duration: Optional[str] = None
    is_featured: bool = False
    is_active: bool = True
    order_index: int = 0


class AudioTrackUpdate(BaseModel):
    category_id: Optional[str] = None
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    artist: Optional[str] = None
    duration: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    order_index: Optional[int] = None


class AudioTrackResponse(BaseModel):
    id: str
    category_id: str
    title: str
    description: Optional[str]
    artist: Optional[str]
    duration: Optional[str]
    audio_filename: Optional[str]
    audio_size: Optional[int]
    play_count: int
    is_featured: bool
    is_active: bool
    order_index: int
    created_at: datetime
    updated_at: datetime
    category: AudioCategoryResponse

    class Config:
        from_attributes = True


# Alter Sound Page Settings Schemas
class AlterSoundPageSettingsUpdate(BaseModel):
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_description: Optional[str] = None
    hero_background_url: Optional[str] = None
    featured_section_title: Optional[str] = None
    categories_section_title: Optional[str] = None
    cta_text: Optional[str] = None
    cta_button_text: Optional[str] = None
    cta_button_link: Optional[str] = None


class AlterSoundPageSettingsResponse(BaseModel):
    id: str
    hero_title: str
    hero_subtitle: str
    hero_description: str
    hero_background_url: Optional[str]
    featured_section_title: str
    categories_section_title: str
    cta_text: Optional[str]
    cta_button_text: Optional[str]
    cta_button_link: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Aggregated response for user-facing page
class AlterSoundPageData(BaseModel):
    settings: AlterSoundPageSettingsResponse
    featured_tracks: List[AudioTrackResponse]
    categories: List[AudioCategoryResponse]
    all_tracks: List[AudioTrackResponse]

