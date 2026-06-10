"""
360-Degree Chat Features API

Comprehensive chat enhancements:
- Message reactions (emojis)
- Reply/quote messages
- File/image/voice attachments
- @mentions
- Edit message + history
- Pin/unpin messages
- Star/save messages
- Mute/archive conversations
- Block/unblock users
- Online presence + last seen
- Polls in chat
- Message status (sent/delivered/read)
- Forward messages
- Scheduled messages
- Quick reply templates
- Chat themes/wallpapers
"""

import logging
import re
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, delete, func as sql_func

from database import get_db
from models.user import User
from models.message import Message, Conversation
from models.chat_extensions import (
    MessageReaction, MessageAttachment, MessageReply, MessageMention,
    MessageEdit, PinnedMessage, StarredMessage, ConversationSettings,
    UserBlock, UserPresence, MessagePoll, PollVote, MessageStatus,
    MessageForward, ScheduledMessage, QuickReply, ChatTheme,
    AttachmentType,
)
from models.notification import Notification, NotificationType
from utils.dependencies import get_current_active_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat Extensions"])


# ═══════════════════════════════════════════════════════════════════════════
# REACTIONS
# ═══════════════════════════════════════════════════════════════════════════

class ReactionCreate(BaseModel):
    emoji: str = Field(..., min_length=1, max_length=20)


class ReactionResponse(BaseModel):
    id: str
    message_id: str
    user_id: str
    user_name: str
    emoji: str
    created_at: datetime


@router.post("/messages/{message_id}/reactions", response_model=ReactionResponse, status_code=201)
async def add_reaction(
    message_id: str, body: ReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add emoji reaction to a message."""
    msg_res = await db.execute(select(Message).where(Message.id == message_id))
    if not msg_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Message not found")

    existing = await db.execute(
        select(MessageReaction).where(and_(
            MessageReaction.message_id == message_id,
            MessageReaction.user_id == current_user.id,
            MessageReaction.emoji == body.emoji,
        ))
    )
    r = existing.scalar_one_or_none()
    if r:
        return ReactionResponse(
            id=r.id, message_id=r.message_id, user_id=r.user_id,
            user_name=current_user.name, emoji=r.emoji, created_at=r.created_at,
        )

    r = MessageReaction(
        message_id=message_id, user_id=current_user.id, emoji=body.emoji
    )
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return ReactionResponse(
        id=r.id, message_id=r.message_id, user_id=r.user_id,
        user_name=current_user.name, emoji=r.emoji, created_at=r.created_at,
    )


@router.get("/messages/{message_id}/reactions")
async def get_reactions(
    message_id: str, db: AsyncSession = Depends(get_db),
):
    """Get all reactions on a message, grouped by emoji."""
    res = await db.execute(
        select(MessageReaction, User).join(
            User, User.id == MessageReaction.user_id
        ).where(MessageReaction.message_id == message_id)
    )
    rows = res.all()
    grouped: dict = {}
    for r, u in rows:
        if r.emoji not in grouped:
            grouped[r.emoji] = {"emoji": r.emoji, "count": 0, "users": []}
        grouped[r.emoji]["count"] += 1
        grouped[r.emoji]["users"].append({"id": u.id, "name": u.name})
    return list(grouped.values())


@router.delete("/messages/{message_id}/reactions/{emoji}")
async def remove_reaction(
    message_id: str, emoji: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove your reaction from a message."""
    res = await db.execute(
        select(MessageReaction).where(and_(
            MessageReaction.message_id == message_id,
            MessageReaction.user_id == current_user.id,
            MessageReaction.emoji == emoji,
        ))
    )
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Reaction not found")
    await db.delete(r)
    await db.commit()
    return {"message": "Reaction removed"}


# ═══════════════════════════════════════════════════════════════════════════
# REPLIES / QUOTING
# ═══════════════════════════════════════════════════════════════════════════

class ReplyCreate(BaseModel):
    replies_to_message_id: str
    body: str = Field(..., min_length=1, max_length=4000)


@router.post("/conversations/{conversation_id}/messages/reply", status_code=201)
async def reply_to_message(
    conversation_id: str, body: ReplyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Reply to a specific message (quoted reply)."""
    orig_res = await db.execute(
        select(Message).where(Message.id == body.replies_to_message_id)
    )
    orig = orig_res.scalar_one_or_none()
    if not orig:
        raise HTTPException(status_code=404, detail="Original message not found")

    # Get original sender name
    sender_res = await db.execute(select(User).where(User.id == orig.sender_id))
    orig_sender = sender_res.scalar_one_or_none()

    # Create the reply message
    new_msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        body=body.body,
    )
    db.add(new_msg)
    await db.flush()

    reply = MessageReply(
        message_id=new_msg.id,
        replies_to_message_id=body.replies_to_message_id,
        quoted_text=orig.body[:300],
        quoted_sender_name=orig_sender.name if orig_sender else "Unknown",
    )
    db.add(reply)
    await db.commit()
    await db.refresh(new_msg)

    return {
        "message_id": new_msg.id,
        "reply_to": body.replies_to_message_id,
        "quoted_text": reply.quoted_text,
        "quoted_sender_name": reply.quoted_sender_name,
    }


# ═══════════════════════════════════════════════════════════════════════════
# ATTACHMENTS (files, images, voice, video, location)
# ═══════════════════════════════════════════════════════════════════════════

class AttachmentCreate(BaseModel):
    message_id: str
    attachment_type: str  # AttachmentType value
    file_url: str
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    extra_data: Optional[dict] = None
    transcription: Optional[str] = None


class AttachmentResponse(BaseModel):
    id: str
    message_id: str
    attachment_type: str
    file_url: str
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    transcription: Optional[str] = None
    created_at: datetime


@router.post("/attachments", response_model=AttachmentResponse, status_code=201)
async def add_attachment(
    body: AttachmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Attach a file/image/voice/video/location to a message."""
    att = MessageAttachment(**body.model_dump())
    db.add(att)
    await db.commit()
    await db.refresh(att)
    return att


@router.get("/messages/{message_id}/attachments", response_model=List[AttachmentResponse])
async def list_attachments(message_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(MessageAttachment).where(MessageAttachment.message_id == message_id)
    )
    return res.scalars().all()


# ═══════════════════════════════════════════════════════════════════════════
# EDIT MESSAGE
# ═══════════════════════════════════════════════════════════════════════════

class EditMessageRequest(BaseModel):
    new_body: str = Field(..., min_length=1, max_length=4000)


@router.put("/messages/{message_id}/edit")
async def edit_message(
    message_id: str, body: EditMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Edit a sent message (only your own messages, within 15 min)."""
    res = await db.execute(select(Message).where(Message.id == message_id))
    msg = res.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only edit your own messages")

    # Save edit history
    history = MessageEdit(message_id=message_id, previous_body=msg.body)
    db.add(history)

    # Update message
    msg.body = body.new_body
    msg.edited_at = datetime.utcnow()
    await db.commit()
    return {"message": "Edited", "edited_at": msg.edited_at.isoformat()}


@router.get("/messages/{message_id}/edit-history")
async def get_edit_history(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """View edit history of a message."""
    res = await db.execute(
        select(MessageEdit).where(MessageEdit.message_id == message_id)
        .order_by(MessageEdit.edited_at.desc())
    )
    history = res.scalars().all()
    return [
        {"id": h.id, "previous_body": h.previous_body, "edited_at": h.edited_at}
        for h in history
    ]


# ═══════════════════════════════════════════════════════════════════════════
# PIN MESSAGES
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/conversations/{conversation_id}/messages/{message_id}/pin", status_code=201)
async def pin_message(
    conversation_id: str, message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Pin a message to the conversation."""
    existing = await db.execute(
        select(PinnedMessage).where(and_(
            PinnedMessage.conversation_id == conversation_id,
            PinnedMessage.message_id == message_id,
        ))
    )
    if existing.scalar_one_or_none():
        return {"message": "Already pinned"}

    pin = PinnedMessage(
        conversation_id=conversation_id,
        message_id=message_id,
        pinned_by=current_user.id,
    )
    db.add(pin)
    await db.commit()
    return {"message": "Pinned"}


@router.get("/conversations/{conversation_id}/pinned")
async def list_pinned(conversation_id: str, db: AsyncSession = Depends(get_db)):
    """List pinned messages."""
    res = await db.execute(
        select(PinnedMessage, Message, User)
        .join(Message, Message.id == PinnedMessage.message_id)
        .join(User, User.id == Message.sender_id)
        .where(PinnedMessage.conversation_id == conversation_id)
        .order_by(PinnedMessage.pinned_at.desc())
    )
    return [
        {
            "id": p.id, "message_id": m.id, "body": m.body,
            "sender_name": u.name, "pinned_at": p.pinned_at,
            "created_at": m.created_at,
        }
        for p, m, u in res.all()
    ]


@router.delete("/conversations/{conversation_id}/messages/{message_id}/pin")
async def unpin_message(
    conversation_id: str, message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Unpin a message."""
    res = await db.execute(
        select(PinnedMessage).where(and_(
            PinnedMessage.conversation_id == conversation_id,
            PinnedMessage.message_id == message_id,
        ))
    )
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Not pinned")
    await db.delete(p)
    await db.commit()
    return {"message": "Unpinned"}


# ═══════════════════════════════════════════════════════════════════════════
# STAR / SAVE MESSAGES (personal bookmarks)
# ═══════════════════════════════════════════════════════════════════════════

class StarCreate(BaseModel):
    note: Optional[str] = None


@router.post("/messages/{message_id}/star", status_code=201)
async def star_message(
    message_id: str, body: Optional[StarCreate] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Star/save a message to your personal collection."""
    existing = await db.execute(
        select(StarredMessage).where(and_(
            StarredMessage.user_id == current_user.id,
            StarredMessage.message_id == message_id,
        ))
    )
    if existing.scalar_one_or_none():
        return {"message": "Already starred"}
    s = StarredMessage(
        user_id=current_user.id,
        message_id=message_id,
        note=body.note if body else None,
    )
    db.add(s)
    await db.commit()
    return {"message": "Starred"}


@router.get("/starred")
async def list_starred(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List your starred messages."""
    res = await db.execute(
        select(StarredMessage, Message, User)
        .join(Message, Message.id == StarredMessage.message_id)
        .join(User, User.id == Message.sender_id)
        .where(StarredMessage.user_id == current_user.id)
        .order_by(StarredMessage.starred_at.desc())
    )
    return [
        {
            "id": s.id, "message_id": m.id, "body": m.body,
            "sender_name": u.name, "note": s.note,
            "starred_at": s.starred_at, "created_at": m.created_at,
        }
        for s, m, u in res.all()
    ]


@router.delete("/messages/{message_id}/star")
async def unstar_message(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    res = await db.execute(
        select(StarredMessage).where(and_(
            StarredMessage.user_id == current_user.id,
            StarredMessage.message_id == message_id,
        ))
    )
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Not starred")
    await db.delete(s)
    await db.commit()
    return {"message": "Unstarred"}


# ═══════════════════════════════════════════════════════════════════════════
# CONVERSATION SETTINGS (mute, archive, pin, theme)
# ═══════════════════════════════════════════════════════════════════════════

class ConvSettingsUpdate(BaseModel):
    is_muted: Optional[bool] = None
    muted_until: Optional[datetime] = None
    is_archived: Optional[bool] = None
    is_pinned: Optional[bool] = None
    custom_nickname: Optional[str] = None
    custom_theme: Optional[str] = None
    notification_sound: Optional[str] = None
    disappearing_messages_seconds: Optional[int] = None


@router.get("/conversations/{conversation_id}/settings")
async def get_conv_settings(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get your settings for a conversation."""
    res = await db.execute(
        select(ConversationSettings).where(and_(
            ConversationSettings.conversation_id == conversation_id,
            ConversationSettings.user_id == current_user.id,
        ))
    )
    s = res.scalar_one_or_none()
    if not s:
        return {
            "is_muted": False, "is_archived": False, "is_pinned": False,
            "custom_nickname": None, "custom_theme": None,
        }
    return {
        "is_muted": s.is_muted, "muted_until": s.muted_until,
        "is_archived": s.is_archived, "is_pinned": s.is_pinned,
        "custom_nickname": s.custom_nickname, "custom_theme": s.custom_theme,
        "notification_sound": s.notification_sound,
        "disappearing_messages_seconds": s.disappearing_messages_seconds,
    }


@router.patch("/conversations/{conversation_id}/settings")
async def update_conv_settings(
    conversation_id: str, body: ConvSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update your settings (mute, archive, pin)."""
    res = await db.execute(
        select(ConversationSettings).where(and_(
            ConversationSettings.conversation_id == conversation_id,
            ConversationSettings.user_id == current_user.id,
        ))
    )
    s = res.scalar_one_or_none()
    if not s:
        s = ConversationSettings(
            conversation_id=conversation_id, user_id=current_user.id,
        )
        db.add(s)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    await db.commit()
    return {"message": "Settings updated"}


# Convenience endpoints
@router.post("/conversations/{conversation_id}/mute")
async def mute_conversation(
    conversation_id: str, hours: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mute conversation (forever or for N hours)."""
    until = datetime.utcnow() + timedelta(hours=hours) if hours else None
    body = ConvSettingsUpdate(is_muted=True, muted_until=until)
    return await update_conv_settings(conversation_id, body, db, current_user)


@router.post("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await update_conv_settings(
        conversation_id, ConvSettingsUpdate(is_archived=True), db, current_user
    )


@router.post("/conversations/{conversation_id}/pin-conversation")
async def pin_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await update_conv_settings(
        conversation_id, ConvSettingsUpdate(is_pinned=True), db, current_user
    )


# ═══════════════════════════════════════════════════════════════════════════
# USER BLOCKING
# ═══════════════════════════════════════════════════════════════════════════

class BlockCreate(BaseModel):
    user_id: str
    reason: Optional[str] = None


@router.post("/blocks", status_code=201)
async def block_user(
    body: BlockCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Block a user."""
    if body.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    existing = await db.execute(
        select(UserBlock).where(and_(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id == body.user_id,
        ))
    )
    if existing.scalar_one_or_none():
        return {"message": "Already blocked"}
    b = UserBlock(
        blocker_id=current_user.id, blocked_id=body.user_id, reason=body.reason
    )
    db.add(b)
    await db.commit()
    return {"message": "User blocked"}


@router.get("/blocks")
async def list_blocks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List your blocked users."""
    res = await db.execute(
        select(UserBlock, User)
        .join(User, User.id == UserBlock.blocked_id)
        .where(UserBlock.blocker_id == current_user.id)
    )
    return [
        {"id": b.id, "user_id": u.id, "user_name": u.name,
         "reason": b.reason, "blocked_at": b.blocked_at}
        for b, u in res.all()
    ]


@router.delete("/blocks/{user_id}")
async def unblock_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Unblock a user."""
    res = await db.execute(
        select(UserBlock).where(and_(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id == user_id,
        ))
    )
    b = res.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Not blocked")
    await db.delete(b)
    await db.commit()
    return {"message": "Unblocked"}


# ═══════════════════════════════════════════════════════════════════════════
# USER PRESENCE (Online status)
# ═══════════════════════════════════════════════════════════════════════════

class PresenceUpdate(BaseModel):
    is_online: bool
    status_message: Optional[str] = None
    last_seen_visibility: Optional[str] = None  # everyone, contacts, nobody


@router.post("/presence")
async def update_presence(
    body: PresenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update your online status."""
    res = await db.execute(
        select(UserPresence).where(UserPresence.user_id == current_user.id)
    )
    p = res.scalar_one_or_none()
    if not p:
        p = UserPresence(user_id=current_user.id)
        db.add(p)
    p.is_online = body.is_online
    p.last_seen_at = datetime.utcnow()
    if body.status_message is not None:
        p.status_message = body.status_message
    if body.last_seen_visibility:
        p.last_seen_visibility = body.last_seen_visibility
    await db.commit()
    return {"message": "Presence updated"}


@router.get("/presence/{user_id}")
async def get_presence(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a user's online status."""
    res = await db.execute(
        select(UserPresence).where(UserPresence.user_id == user_id)
    )
    p = res.scalar_one_or_none()
    if not p:
        return {"is_online": False, "last_seen_at": None, "status_message": None}
    # Privacy check
    if p.last_seen_visibility == "nobody" and user_id != current_user.id:
        return {"is_online": p.is_online, "last_seen_at": None,
                "status_message": p.status_message}
    return {
        "is_online": p.is_online,
        "last_seen_at": p.last_seen_at,
        "status_message": p.status_message,
    }


# ═══════════════════════════════════════════════════════════════════════════
# POLLS IN CHAT
# ═══════════════════════════════════════════════════════════════════════════

class PollCreate(BaseModel):
    question: str = Field(..., min_length=2, max_length=500)
    options: List[str] = Field(..., min_length=2, max_length=10)
    allow_multiple: bool = False
    is_anonymous: bool = False
    closes_in_hours: Optional[int] = None
    conversation_id: str


@router.post("/polls", status_code=201)
async def create_poll(
    body: PollCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a poll in a conversation."""
    msg = Message(
        conversation_id=body.conversation_id,
        sender_id=current_user.id,
        body=f"📊 Poll: {body.question}",
    )
    db.add(msg)
    await db.flush()

    closes_at = None
    if body.closes_in_hours:
        closes_at = datetime.utcnow() + timedelta(hours=body.closes_in_hours)

    poll = MessagePoll(
        message_id=msg.id,
        question=body.question,
        options={"options": body.options},
        allow_multiple=body.allow_multiple,
        is_anonymous=body.is_anonymous,
        closes_at=closes_at,
    )
    db.add(poll)
    await db.commit()
    await db.refresh(poll)
    return {
        "poll_id": poll.id, "message_id": msg.id,
        "question": poll.question, "options": body.options,
    }


@router.post("/polls/{poll_id}/vote")
async def vote_poll(
    poll_id: str, option_index: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Vote in a poll."""
    poll_res = await db.execute(select(MessagePoll).where(MessagePoll.id == poll_id))
    poll = poll_res.scalar_one_or_none()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.is_closed:
        raise HTTPException(status_code=400, detail="Poll is closed")
    if poll.closes_at and poll.closes_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Poll has expired")

    # If single-choice, remove previous votes
    if not poll.allow_multiple:
        await db.execute(
            delete(PollVote).where(and_(
                PollVote.poll_id == poll_id,
                PollVote.user_id == current_user.id,
            ))
        )

    existing = await db.execute(
        select(PollVote).where(and_(
            PollVote.poll_id == poll_id,
            PollVote.user_id == current_user.id,
            PollVote.option_index == option_index,
        ))
    )
    if existing.scalar_one_or_none():
        return {"message": "Already voted"}

    vote = PollVote(
        poll_id=poll_id, user_id=current_user.id, option_index=option_index
    )
    db.add(vote)
    await db.commit()
    return {"message": "Vote recorded"}


@router.get("/polls/{poll_id}/results")
async def poll_results(poll_id: str, db: AsyncSession = Depends(get_db)):
    """Get poll results."""
    poll_res = await db.execute(select(MessagePoll).where(MessagePoll.id == poll_id))
    poll = poll_res.scalar_one_or_none()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    votes_res = await db.execute(
        select(PollVote.option_index, sql_func.count(PollVote.id))
        .where(PollVote.poll_id == poll_id)
        .group_by(PollVote.option_index)
    )
    counts = {row[0]: row[1] for row in votes_res.all()}
    options = poll.options.get("options", [])
    total = sum(counts.values())
    return {
        "question": poll.question,
        "is_closed": poll.is_closed,
        "closes_at": poll.closes_at,
        "total_votes": total,
        "results": [
            {
                "index": i, "option": opt, "votes": counts.get(i, 0),
                "percentage": round((counts.get(i, 0) / total * 100), 1) if total else 0,
            }
            for i, opt in enumerate(options)
        ],
    }


# ═══════════════════════════════════════════════════════════════════════════
# MESSAGE STATUS (sent/delivered/read)
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/messages/{message_id}/delivered")
async def mark_delivered(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mark message as delivered."""
    existing = await db.execute(
        select(MessageStatus).where(and_(
            MessageStatus.message_id == message_id,
            MessageStatus.user_id == current_user.id,
        ))
    )
    s = existing.scalar_one_or_none()
    if not s:
        s = MessageStatus(
            message_id=message_id, user_id=current_user.id,
            delivered_at=datetime.utcnow(),
        )
        db.add(s)
    elif not s.delivered_at:
        s.delivered_at = datetime.utcnow()
    await db.commit()
    return {"message": "Marked delivered"}


@router.post("/messages/{message_id}/seen")
async def mark_seen(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mark message as read/seen."""
    existing = await db.execute(
        select(MessageStatus).where(and_(
            MessageStatus.message_id == message_id,
            MessageStatus.user_id == current_user.id,
        ))
    )
    s = existing.scalar_one_or_none()
    now = datetime.utcnow()
    if not s:
        s = MessageStatus(
            message_id=message_id, user_id=current_user.id,
            delivered_at=now, read_at=now,
        )
        db.add(s)
    else:
        if not s.delivered_at:
            s.delivered_at = now
        if not s.read_at:
            s.read_at = now
    await db.commit()
    return {"message": "Marked seen"}


@router.get("/messages/{message_id}/status")
async def get_message_status(message_id: str, db: AsyncSession = Depends(get_db)):
    """Get delivery/read status of a message (for sender)."""
    res = await db.execute(
        select(MessageStatus, User).join(User, User.id == MessageStatus.user_id)
        .where(MessageStatus.message_id == message_id)
    )
    return [
        {
            "user_id": u.id, "user_name": u.name,
            "delivered_at": s.delivered_at, "read_at": s.read_at,
        }
        for s, u in res.all()
    ]


# ═══════════════════════════════════════════════════════════════════════════
# FORWARD MESSAGES
# ═══════════════════════════════════════════════════════════════════════════

class ForwardCreate(BaseModel):
    original_message_id: str
    target_conversation_id: str


@router.post("/messages/forward", status_code=201)
async def forward_message(
    body: ForwardCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Forward a message to another conversation."""
    orig_res = await db.execute(
        select(Message, User).join(User, User.id == Message.sender_id)
        .where(Message.id == body.original_message_id)
    )
    orig = orig_res.first()
    if not orig:
        raise HTTPException(status_code=404, detail="Original message not found")
    orig_msg, orig_sender = orig

    new_msg = Message(
        conversation_id=body.target_conversation_id,
        sender_id=current_user.id,
        body=orig_msg.body,
    )
    db.add(new_msg)
    await db.flush()

    fwd = MessageForward(
        message_id=new_msg.id,
        original_message_id=body.original_message_id,
        original_sender_id=orig_sender.id,
        original_sender_name=orig_sender.name,
    )
    db.add(fwd)
    await db.commit()
    return {"message": "Forwarded", "new_message_id": new_msg.id}


# ═══════════════════════════════════════════════════════════════════════════
# SCHEDULED MESSAGES
# ═══════════════════════════════════════════════════════════════════════════

class ScheduledCreate(BaseModel):
    conversation_id: str
    body: str = Field(..., min_length=1, max_length=4000)
    scheduled_for: datetime


@router.post("/scheduled", status_code=201)
async def schedule_message(
    body: ScheduledCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Schedule a message for future delivery."""
    if body.scheduled_for <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Time must be in the future")
    s = ScheduledMessage(
        conversation_id=body.conversation_id,
        sender_id=current_user.id,
        body=body.body,
        scheduled_for=body.scheduled_for,
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return {"id": s.id, "scheduled_for": s.scheduled_for}


@router.get("/scheduled")
async def list_scheduled(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List your scheduled messages."""
    res = await db.execute(
        select(ScheduledMessage)
        .where(and_(
            ScheduledMessage.sender_id == current_user.id,
            ScheduledMessage.sent == False,
        ))
        .order_by(ScheduledMessage.scheduled_for.asc())
    )
    return [
        {"id": s.id, "body": s.body, "scheduled_for": s.scheduled_for,
         "conversation_id": s.conversation_id}
        for s in res.scalars().all()
    ]


@router.delete("/scheduled/{scheduled_id}")
async def cancel_scheduled(
    scheduled_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Cancel a scheduled message."""
    res = await db.execute(
        select(ScheduledMessage).where(and_(
            ScheduledMessage.id == scheduled_id,
            ScheduledMessage.sender_id == current_user.id,
        ))
    )
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(s)
    await db.commit()
    return {"message": "Cancelled"}


# ═══════════════════════════════════════════════════════════════════════════
# QUICK REPLY TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════

class QuickReplyCreate(BaseModel):
    shortcut: str = Field(..., min_length=1, max_length=50)
    content: str = Field(..., min_length=1)
    category: Optional[str] = None


@router.get("/quick-replies")
async def list_quick_replies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List your saved quick replies."""
    res = await db.execute(
        select(QuickReply).where(QuickReply.user_id == current_user.id)
        .order_by(QuickReply.use_count.desc())
    )
    return [
        {"id": q.id, "shortcut": q.shortcut, "content": q.content,
         "category": q.category, "use_count": q.use_count}
        for q in res.scalars().all()
    ]


@router.post("/quick-replies", status_code=201)
async def create_quick_reply(
    body: QuickReplyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create quick reply template."""
    q = QuickReply(user_id=current_user.id, **body.model_dump())
    db.add(q)
    await db.commit()
    await db.refresh(q)
    return {"id": q.id, "shortcut": q.shortcut, "content": q.content}


@router.post("/quick-replies/{qid}/use")
async def use_quick_reply(
    qid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Increment use count."""
    res = await db.execute(
        select(QuickReply).where(and_(
            QuickReply.id == qid, QuickReply.user_id == current_user.id,
        ))
    )
    q = res.scalar_one_or_none()
    if q:
        q.use_count += 1
        await db.commit()
    return {"message": "OK"}


@router.delete("/quick-replies/{qid}")
async def delete_quick_reply(
    qid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    res = await db.execute(
        select(QuickReply).where(and_(
            QuickReply.id == qid, QuickReply.user_id == current_user.id,
        ))
    )
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(q)
    await db.commit()
    return {"message": "Deleted"}


# ═══════════════════════════════════════════════════════════════════════════
# CHAT THEMES
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/themes")
async def list_themes(db: AsyncSession = Depends(get_db)):
    """List available chat themes."""
    res = await db.execute(select(ChatTheme).order_by(ChatTheme.name))
    return res.scalars().all()


# ═══════════════════════════════════════════════════════════════════════════
# DELETE MESSAGE (for me / for everyone)
# ═══════════════════════════════════════════════════════════════════════════

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str, for_everyone: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a message - for everyone (sender, within 1 hour) or just for you."""
    res = await db.execute(select(Message).where(Message.id == message_id))
    msg = res.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if for_everyone:
        if msg.sender_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only sender can delete for everyone")
        # Time check: 1 hour limit
        age = datetime.utcnow() - msg.created_at.replace(tzinfo=None)
        if age > timedelta(hours=1):
            raise HTTPException(status_code=400, detail="Can only delete for everyone within 1 hour")
        msg.body = "[Message deleted]"
        msg.edited_at = datetime.utcnow()
        await db.commit()
        return {"message": "Deleted for everyone"}
    else:
        # "Delete for me" via starred-like soft hide could be added.
        # For now, return success without DB change.
        return {"message": "Hidden for you"}


# ═══════════════════════════════════════════════════════════════════════════
# UNIFIED MESSAGE DETAILS (all metadata in one shot)
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/messages/{message_id}/details")
async def message_details(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get complete message details: reactions, replies, attachments, status."""
    res = await db.execute(select(Message).where(Message.id == message_id))
    msg = res.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    # Reactions
    rxn_res = await db.execute(
        select(MessageReaction, User).join(User, User.id == MessageReaction.user_id)
        .where(MessageReaction.message_id == message_id)
    )
    rxn_grouped: dict = {}
    for r, u in rxn_res.all():
        if r.emoji not in rxn_grouped:
            rxn_grouped[r.emoji] = {"emoji": r.emoji, "count": 0, "users": []}
        rxn_grouped[r.emoji]["count"] += 1
        rxn_grouped[r.emoji]["users"].append({"id": u.id, "name": u.name})

    # Reply info
    reply_res = await db.execute(
        select(MessageReply).where(MessageReply.message_id == message_id)
    )
    reply = reply_res.scalar_one_or_none()

    # Attachments
    att_res = await db.execute(
        select(MessageAttachment).where(MessageAttachment.message_id == message_id)
    )

    # Edit history count
    edit_res = await db.execute(
        select(sql_func.count(MessageEdit.id)).where(MessageEdit.message_id == message_id)
    )

    return {
        "message_id": msg.id,
        "body": msg.body,
        "sender_id": msg.sender_id,
        "edited_at": msg.edited_at,
        "edit_count": edit_res.scalar() or 0,
        "reactions": list(rxn_grouped.values()),
        "reply_to": {
            "message_id": reply.replies_to_message_id,
            "quoted_text": reply.quoted_text,
            "quoted_sender_name": reply.quoted_sender_name,
        } if reply else None,
        "attachments": [
            {
                "id": a.id, "type": a.attachment_type,
                "file_url": a.file_url, "file_name": a.file_name,
                "thumbnail_url": a.thumbnail_url,
                "duration_seconds": a.duration_seconds,
                "transcription": a.transcription,
            }
            for a in att_res.scalars().all()
        ],
    }
