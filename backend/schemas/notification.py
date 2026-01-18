"""
Pydantic schemas for notification endpoints.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from models.notification import NotificationType


# ============= Response Schemas =============

class NotificationResponse(BaseModel):
    """Response schema for a single notification."""
    id: str
    title: str
    message: str
    type: NotificationType
    is_read: bool
    reference_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Response schema for list of notifications."""
    notifications: list[NotificationResponse]
    total: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    """Response schema for unread notification count."""
    unread_count: int
