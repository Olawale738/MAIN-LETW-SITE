"""
Message API routes
Handles message CRUD, searching, and notifications
"""

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, and_, desc, func
from datetime import datetime
from typing import List, Optional
from models.message import Message, Conversation
from models.user import User
from models.message_read import MessageReadReceipt
from services.notifications import NotificationService
from utils.permissions import PermissionChecker
from database import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/api/messages", tags=["messages"])

# Request/Response models
class MessageCreate(BaseModel):
    conversation_id: str
    body: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    body: str
    created_at: str
    read_count: int = 0
    read_by: list = []

    class Config:
        from_attributes = True


class SearchQuery(BaseModel):
    q: str
    conversation_id: Optional[str] = None
    from_user_id: Optional[str] = None
    to_user_id: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    limit: int = 20
    offset: int = 0


class SearchResponse(BaseModel):
    total: int
    results: List[MessageResponse]
    query: str


# Get current user helper
async def get_current_user(db: Session = Depends(get_db), token: str = Query(None)):
    """Get current user from token"""
    # This should validate the JWT token and return the user
    # Implementation depends on your auth system
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Your auth logic here
    return None


@router.post("/send", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message in a conversation"""
    # Verify permission to send in conversation
    conversation = db.execute(
        select(Conversation).where(Conversation.id == message.conversation_id)
    ).scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if user is part of conversation
    if (conversation.user_id != current_user.id and
        conversation.admin_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Create message
    new_message = Message(
        conversation_id=message.conversation_id,
        sender_id=current_user.id,
        body=message.body,
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # Send notification
    NotificationService.notify_message_sent(conversation, new_message, current_user, db)

    return MessageResponse(
        **{k: v for k, v in new_message.__dict__.items() if k != '_sa_instance_state'},
        read_count=0,
        read_by=[]
    )


@router.get("/conversation/{conversation_id}", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages in a conversation"""
    conversation = db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    ).scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Verify access
    if (conversation.user_id != current_user.id and
        conversation.admin_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get messages
    messages = db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(desc(Message.created_at))
        .limit(limit)
        .offset(offset)
    ).scalars().all()

    # Mark as read
    for message in messages:
        if message.sender_id != current_user.id:
            NotificationService.notify_message_read(message, current_user, db)

    # Get read counts
    results = []
    for message in messages:
        read_count = NotificationService.get_read_count(message, db)
        read_status = NotificationService.get_read_status(message, conversation, db)

        results.append(MessageResponse(
            id=message.id,
            conversation_id=message.conversation_id,
            sender_id=message.sender_id,
            body=message.body,
            created_at=message.created_at.isoformat(),
            read_count=read_status['read_count'],
            read_by=read_status['read_by']
        ))

    return results


@router.get("/search", response_model=SearchResponse)
async def search_messages(
    q: str = Query(..., min_length=1),
    conversation_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search messages
    Query parameter: q (search term)
    Optional: conversation_id to limit to one conversation
    """
    # Build query
    query = select(Message).where(
        Message.body.ilike(f"%{q}%")
    )

    # Limit to conversation if specified
    if conversation_id:
        conversation = db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        ).scalar_one_or_none()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Check access
        if (conversation.user_id != current_user.id and
            conversation.admin_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized")

        query = query.where(Message.conversation_id == conversation_id)
    else:
        # Only search in conversations user is part of
        query = query.where(
            or_(
                Message.conversation_id.in_(
                    select(Conversation.id).where(
                        Conversation.user_id == current_user.id
                    )
                ),
                Message.conversation_id.in_(
                    select(Conversation.id).where(
                        Conversation.admin_id == current_user.id
                    )
                ),
            )
        )

    # Get total count
    total = db.execute(
        select(func.count(Message.id)).where(query.whereclause)
    ).scalar() or 0

    # Execute search with pagination
    messages = db.execute(
        query.order_by(desc(Message.created_at))
        .limit(limit)
        .offset(offset)
    ).scalars().all()

    # Format results
    results = []
    for message in messages:
        conversation = db.execute(
            select(Conversation).where(Conversation.id == message.conversation_id)
        ).scalar_one()

        read_status = NotificationService.get_read_status(message, conversation, db)

        results.append(MessageResponse(
            id=message.id,
            conversation_id=message.conversation_id,
            sender_id=message.sender_id,
            body=message.body,
            created_at=message.created_at.isoformat(),
            read_count=read_status['read_count'],
            read_by=read_status['read_by']
        ))

    return SearchResponse(
        total=total,
        results=results,
        query=q
    )


@router.post("/{message_id}/read")
async def mark_message_as_read(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a message as read"""
    message = db.execute(
        select(Message).where(Message.id == message_id)
    ).scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Verify access
    conversation = db.execute(
        select(Conversation).where(Conversation.id == message.conversation_id)
    ).scalar_one()

    if (conversation.user_id != current_user.id and
        conversation.admin_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Mark as read
    NotificationService.notify_message_read(message, current_user, db)

    return {"status": "ok"}


@router.get("/{message_id}/read-status")
async def get_message_read_status(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get read status for a message"""
    message = db.execute(
        select(Message).where(Message.id == message_id)
    ).scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Verify access
    conversation = db.execute(
        select(Conversation).where(Conversation.id == message.conversation_id)
    ).scalar_one()

    if (conversation.user_id != current_user.id and
        conversation.admin_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get read status
    read_status = NotificationService.get_read_status(message, conversation, db)

    return read_status


@router.get("/user/{user_id}/unread-count")
async def get_user_unread_count(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get unread message count for a user"""
    # Only allow users to check their own unread count
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    unread_count = NotificationService.get_unread_count(current_user, db)

    return {"unread_count": unread_count}
