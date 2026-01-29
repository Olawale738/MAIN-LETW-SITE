from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

# Page Schemas
class PageBase(BaseModel):
    title: str
    content: Dict[str, Any] # Flexible JSON content

class PageCreate(PageBase):
    slug: str

class PageUpdate(PageBase):
    pass

class PageResponse(PageBase):
    id: str
    slug: str
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Image Schemas
class ImageResponse(BaseModel):
    id: str
    filename: str
    mime_type: str
    size: Optional[int]
    url: str  # Computed URL to fetch image
    created_at: datetime
    
    class Config:
        from_attributes = True
