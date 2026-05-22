"""
Pydantic schemas for the chat / messaging feature.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    """Payload for sending a new message."""
    body: str = Field(..., min_length=1, max_length=4000)
    attachment_url: Optional[str] = None


class ConversationCreate(BaseModel):
    """Payload for starting a new conversation."""
    subject: Optional[str] = Field(default=None, max_length=255)
    initial_message: str = Field(..., min_length=1, max_length=4000)
    # Optional explicit admin recipient; if omitted any admin can pick it up
    admin_id: Optional[str] = None


class SenderSummary(BaseModel):
    """Minimal info about a message sender."""
    id: str
    name: str
    role: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """A message returned by the API."""
    id: str
    conversation_id: str
    sender_id: str
    sender: Optional[SenderSummary] = None
    body: str
    attachment_url: Optional[str] = None
    is_read: bool
    edited_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationParticipant(BaseModel):
    id: str
    name: str
    role: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """A conversation in inbox / list view."""
    id: str
    subject: Optional[str] = None
    status: str
    user: Optional[ConversationParticipant] = None
    admin: Optional[ConversationParticipant] = None
    last_message_preview: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_for_user: int
    unread_for_admin: int
    # Convenience: unread count for *the requesting* user
    my_unread: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    """Conversation with its messages embedded."""
    messages: List[MessageResponse] = []


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]
    total: int
    total_unread: int


class TypingEvent(BaseModel):
    """WebSocket typing indicator payload."""
    conversation_id: str
    is_typing: bool
