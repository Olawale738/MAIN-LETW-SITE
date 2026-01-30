from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class LiveStreamBase(BaseModel):
    title: Optional[str] = None
    url: str
    is_active: bool = True

class LiveStreamCreate(LiveStreamBase):
    pass

class LiveStreamUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    is_active: Optional[bool] = None

class LiveStreamResponse(LiveStreamBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
