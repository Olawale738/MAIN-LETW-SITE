"""
Live chat API - user-to-admin messaging with polling.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from database import get_db
from models.user import User, UserRole
from models.chat import ChatConversation, ChatMessage
from utils.dependencies import get_current_active_user

router = APIRouter(prefix="/api/chat", tags=["Chat"])


# ─── Schemas ────────────────────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    is_admin: bool
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    is_open: bool
    unread_count: int
    last_message: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    content: str


# ─── Helpers ────────────────────────────────────────────────────────────────

async def _get_or_create_conversation(user_id: str, db: AsyncSession) -> ChatConversation:
    result = await db.execute(
        select(ChatConversation).where(ChatConversation.user_id == user_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        conv = ChatConversation(user_id=user_id)
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
    return conv


# ─── User endpoints ──────────────────────────────────────────────────────────

@router.get("/messages", response_model=list[MessageOut])
async def get_my_messages(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages in the current user's conversation."""
    conv = await _get_or_create_conversation(current_user.id, db)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()

    # Mark admin messages as read
    await db.execute(
        update(ChatMessage)
        .where(
            ChatMessage.conversation_id == conv.id,
            ChatMessage.is_admin == True,
            ChatMessage.is_read == False,
        )
        .values(is_read=True)
    )
    await db.commit()
    return messages


@router.post("/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    body: SendMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to admin."""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    conv = await _get_or_create_conversation(current_user.id, db)
    msg = ChatMessage(
        conversation_id=conv.id,
        sender_id=current_user.id,
        is_admin=False,
        content=body.content.strip(),
    )
    db.add(msg)
    # Update conversation timestamp
    conv.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(msg)
    return msg


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get count of unread admin messages for the current user."""
    result = await db.execute(
        select(ChatConversation).where(ChatConversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        return {"unread_count": 0}

    from sqlalchemy import func as sqlfunc
    count_result = await db.execute(
        select(sqlfunc.count(ChatMessage.id))
        .where(
            ChatMessage.conversation_id == conv.id,
            ChatMessage.is_admin == True,
            ChatMessage.is_read == False,
        )
    )
    return {"unread_count": count_result.scalar() or 0}


# ─── Admin endpoints ─────────────────────────────────────────────────────────

async def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/admin/conversations", response_model=list[ConversationOut])
async def admin_get_conversations(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: list all conversations with unread counts."""
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(ChatConversation)
        .options(selectinload(ChatConversation.messages))
        .order_by(ChatConversation.updated_at.desc())
    )
    convs = result.scalars().all()

    # Fetch user info for each conversation
    user_ids = [c.user_id for c in convs]
    users_result = await db.execute(
        select(User).where(User.id.in_(user_ids))
    )
    users_map = {u.id: u for u in users_result.scalars().all()}

    out = []
    for conv in convs:
        user = users_map.get(conv.user_id)
        unread = sum(1 for m in conv.messages if not m.is_admin and not m.is_read)
        last_msg = conv.messages[-1].content if conv.messages else None
        out.append(ConversationOut(
            id=conv.id,
            user_id=conv.user_id,
            user_name=user.name if user else "Unknown",
            user_email=user.email if user else "",
            is_open=conv.is_open,
            unread_count=unread,
            last_message=last_msg,
            updated_at=conv.updated_at,
        ))
    return out


@router.get("/admin/conversations/{user_id}/messages", response_model=list[MessageOut])
async def admin_get_user_messages(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: get all messages for a specific user."""
    conv = await _get_or_create_conversation(user_id, db)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()

    # Mark user messages as read
    await db.execute(
        update(ChatMessage)
        .where(
            ChatMessage.conversation_id == conv.id,
            ChatMessage.is_admin == False,
            ChatMessage.is_read == False,
        )
        .values(is_read=True)
    )
    await db.commit()
    return messages


@router.post("/admin/conversations/{user_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def admin_reply(
    user_id: str,
    body: SendMessageRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: send a reply to a user."""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    conv = await _get_or_create_conversation(user_id, db)
    msg = ChatMessage(
        conversation_id=conv.id,
        sender_id=admin.id,
        is_admin=True,
        content=body.content.strip(),
    )
    db.add(msg)
    conv.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(msg)
    return msg


@router.get("/admin/unread-total")
async def admin_total_unread(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: total count of unread user messages across all conversations."""
    from sqlalchemy import func as sqlfunc
    result = await db.execute(
        select(sqlfunc.count(ChatMessage.id))
        .where(ChatMessage.is_admin == False, ChatMessage.is_read == False)
    )
    return {"unread_count": result.scalar() or 0}
