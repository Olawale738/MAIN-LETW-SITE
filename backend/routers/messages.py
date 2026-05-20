"""
Messaging / chat API.

Endpoints:
    GET    /api/messages/conversations               - list my conversations
    POST   /api/messages/conversations               - start a new conversation
    GET    /api/messages/conversations/{id}          - get conversation + messages
    POST   /api/messages/conversations/{id}/messages - send a message
    POST   /api/messages/conversations/{id}/read     - mark conversation as read
    POST   /api/messages/conversations/{id}/close    - close (user or admin)
    GET    /api/messages/unread-count                - total unread for the current user
    GET    /api/messages/admins                      - list admins user can DM
    WS     /api/messages/ws                          - realtime updates (?token=JWT)

For admins:
    GET    /api/messages/admin/inbox                 - admin sees every conversation
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Set, Optional

from fastapi import (
    APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect,
    Query,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, update
from sqlalchemy.orm import selectinload

from database import get_db, AsyncSessionLocal
from models.user import User, UserRole
from models.message import Conversation, Message, ConversationStatus
from models.notification import Notification, NotificationType
from schemas.message import (
    MessageCreate, ConversationCreate,
    MessageResponse, ConversationResponse, ConversationDetailResponse,
    ConversationListResponse, SenderSummary, ConversationParticipant,
)
from schemas.auth import MessageResponse as ApiMessage
from utils.dependencies import get_current_active_user, get_admin_user
from utils.security import decode_token


router = APIRouter(prefix="/api/messages", tags=["Messages"])


# ---------------------------------------------------------------------------
# Realtime: a tiny in-memory WebSocket connection manager.
# Single-process only - good enough for current deployment scale; can be
# swapped for Redis pubsub later without changing the API surface.
# ---------------------------------------------------------------------------
class ConnectionManager:
    def __init__(self) -> None:
        # user_id -> set of websockets (a user can be on multiple tabs)
        self.active: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self.active.setdefault(user_id, set()).add(ws)

    async def disconnect(self, user_id: str, ws: WebSocket) -> None:
        async with self._lock:
            conns = self.active.get(user_id)
            if conns:
                conns.discard(ws)
                if not conns:
                    self.active.pop(user_id, None)

    async def send_personal(self, user_id: str, payload: dict) -> None:
        conns = list(self.active.get(user_id, ()))
        for ws in conns:
            try:
                await ws.send_json(payload)
            except Exception:
                # Drop dead sockets silently
                await self.disconnect(user_id, ws)

    async def broadcast_admins(self, payload: dict) -> None:
        """Send to all currently-connected admin sessions."""
        # Caller is responsible for ensuring the recipient is an admin
        # (handled by upstream lookups).
        for uid, conns in list(self.active.items()):
            for ws in list(conns):
                try:
                    await ws.send_json(payload)
                except Exception:
                    await self.disconnect(uid, ws)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _participant(user: Optional[User]) -> Optional[ConversationParticipant]:
    if user is None:
        return None
    return ConversationParticipant(
        id=user.id,
        name=user.name,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        avatar_url=user.avatar_url,
    )


def _serialize_message(m: Message) -> MessageResponse:
    return MessageResponse(
        id=m.id,
        conversation_id=m.conversation_id,
        sender_id=m.sender_id,
        sender=SenderSummary(
            id=m.sender.id,
            name=m.sender.name,
            role=m.sender.role.value if hasattr(m.sender.role, "value") else str(m.sender.role),
            avatar_url=m.sender.avatar_url,
        ) if m.sender else None,
        body=m.body,
        attachment_url=m.attachment_url,
        is_read=m.is_read,
        edited_at=m.edited_at,
        created_at=m.created_at,
    )


def _serialize_conversation(
    c: Conversation, viewer_id: str
) -> ConversationResponse:
    my_unread = (
        c.unread_for_user if c.user_id == viewer_id else c.unread_for_admin
    )
    return ConversationResponse(
        id=c.id,
        subject=c.subject,
        status=c.status.value if hasattr(c.status, "value") else str(c.status),
        user=_participant(c.user),
        admin=_participant(c.admin),
        last_message_preview=c.last_message_preview,
        last_message_at=c.last_message_at,
        unread_for_user=c.unread_for_user,
        unread_for_admin=c.unread_for_admin,
        my_unread=my_unread,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


async def _ensure_participant(
    conv: Conversation, user: User
) -> None:
    """Allow only the conversation's user, its admin, or any admin user."""
    is_user_party = conv.user_id == user.id
    is_admin_party = conv.admin_id == user.id
    is_admin = user.role == UserRole.ADMIN
    if not (is_user_party or is_admin_party or is_admin):
        raise HTTPException(status_code=403, detail="Not a participant of this conversation")


async def _pick_admin(db: AsyncSession, exclude_user_id: Optional[str] = None) -> Optional[User]:
    """Pick an arbitrary active admin for fallback routing."""
    q = select(User).where(User.role == UserRole.ADMIN)
    if exclude_user_id:
        q = q.where(User.id != exclude_user_id)
    q = q.limit(1)
    return (await db.execute(q)).scalar_one_or_none()


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------

@router.get("/admins", response_model=List[ConversationParticipant])
async def list_admins(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List admins the current user can message."""
    res = await db.execute(
        select(User).where(User.role == UserRole.ADMIN).order_by(User.name)
    )
    admins = res.scalars().all()
    return [
        ConversationParticipant(
            id=a.id, name=a.name,
            role=a.role.value if hasattr(a.role, "value") else str(a.role),
            avatar_url=a.avatar_url,
        )
        for a in admins
    ]


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations the current user participates in."""
    if current_user.role == UserRole.ADMIN:
        q = (
            select(Conversation)
            .where(or_(
                Conversation.admin_id == current_user.id,
                Conversation.admin_id.is_(None),  # unassigned, any admin can see
            ))
            .options(selectinload(Conversation.user), selectinload(Conversation.admin))
            .order_by(Conversation.last_message_at.desc().nulls_last(), Conversation.created_at.desc())
        )
    else:
        q = (
            select(Conversation)
            .where(Conversation.user_id == current_user.id)
            .options(selectinload(Conversation.user), selectinload(Conversation.admin))
            .order_by(Conversation.last_message_at.desc().nulls_last(), Conversation.created_at.desc())
        )

    res = await db.execute(q)
    convs = res.scalars().all()

    items = [_serialize_conversation(c, current_user.id) for c in convs]
    total_unread = sum(i.my_unread for i in items)
    return ConversationListResponse(
        conversations=items,
        total=len(items),
        total_unread=total_unread,
    )


@router.post("/conversations", response_model=ConversationDetailResponse, status_code=201)
async def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new conversation with an admin/pastor."""
    # Resolve admin recipient
    admin: Optional[User] = None
    if payload.admin_id:
        res = await db.execute(
            select(User).where(
                User.id == payload.admin_id,
                User.role == UserRole.ADMIN,
            )
        )
        admin = res.scalar_one_or_none()
        if admin is None:
            raise HTTPException(status_code=404, detail="Admin not found")
    else:
        admin = await _pick_admin(db, exclude_user_id=current_user.id)

    now = datetime.utcnow()
    conv = Conversation(
        user_id=current_user.id,
        admin_id=admin.id if admin else None,
        subject=payload.subject or "New conversation",
        status=ConversationStatus.OPEN,
        last_message_preview=payload.initial_message[:200],
        last_message_at=now,
        unread_for_user=0,
        unread_for_admin=1,
    )
    db.add(conv)
    await db.flush()  # need conv.id

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        body=payload.initial_message,
    )
    db.add(msg)

    # Notification for the admin recipient (if any)
    if admin is not None:
        db.add(Notification(
            user_id=admin.id,
            title=f"New message from {current_user.name}",
            message=payload.initial_message[:140],
            type=NotificationType.GENERAL,
            reference_id=conv.id,
        ))

    await db.commit()

    # Reload with eager loads for nicely serialized response
    res = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv.id)
        .options(
            selectinload(Conversation.user),
            selectinload(Conversation.admin),
            selectinload(Conversation.messages).selectinload(Message.sender),
        )
    )
    conv = res.scalar_one()

    detail = ConversationDetailResponse(
        **_serialize_conversation(conv, current_user.id).model_dump(),
        messages=[_serialize_message(m) for m in conv.messages],
    )

    # Notify recipient via WS
    if admin is not None:
        await manager.send_personal(admin.id, {
            "type": "conversation.created",
            "conversation": detail.model_dump(mode="json"),
        })

    return detail


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(
            selectinload(Conversation.user),
            selectinload(Conversation.admin),
            selectinload(Conversation.messages).selectinload(Message.sender),
        )
    )
    conv = res.scalar_one_or_none()
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await _ensure_participant(conv, current_user)

    # Auto-mark read for the viewer side
    if conv.user_id == current_user.id and conv.unread_for_user:
        conv.unread_for_user = 0
    elif current_user.role == UserRole.ADMIN and conv.unread_for_admin:
        conv.unread_for_admin = 0
        # If unassigned, claim the conversation
        if conv.admin_id is None:
            conv.admin_id = current_user.id
    await db.commit()

    # Reload with sender info (in case admin was just assigned)
    res = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv.id)
        .options(
            selectinload(Conversation.user),
            selectinload(Conversation.admin),
            selectinload(Conversation.messages).selectinload(Message.sender),
        )
    )
    conv = res.scalar_one()

    return ConversationDetailResponse(
        **_serialize_conversation(conv, current_user.id).model_dump(),
        messages=[_serialize_message(m) for m in conv.messages],
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=201,
)
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
        .options(selectinload(Conversation.user), selectinload(Conversation.admin))
    )
    conv = res.scalar_one_or_none()
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await _ensure_participant(conv, current_user)

    if conv.status == ConversationStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Conversation is closed")

    # If an admin replies on an unassigned conversation, claim it
    if current_user.role == UserRole.ADMIN and conv.admin_id is None:
        conv.admin_id = current_user.id

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        body=payload.body,
        attachment_url=payload.attachment_url,
    )
    db.add(msg)

    # Update denormalised conversation fields
    conv.last_message_preview = payload.body[:200]
    conv.last_message_at = datetime.utcnow()
    if current_user.id == conv.user_id:
        conv.unread_for_admin += 1
    else:
        conv.unread_for_user += 1

    # Notification for the other side (skip noisy ones if admin already chatting)
    other_user_id: Optional[str] = None
    if current_user.id == conv.user_id and conv.admin_id:
        other_user_id = conv.admin_id
    elif current_user.id != conv.user_id:
        other_user_id = conv.user_id

    if other_user_id:
        db.add(Notification(
            user_id=other_user_id,
            title=f"New message from {current_user.name}",
            message=payload.body[:140],
            type=NotificationType.GENERAL,
            reference_id=conv.id,
        ))

    await db.commit()
    await db.refresh(msg)

    # Reload with sender for response
    res = await db.execute(
        select(Message).where(Message.id == msg.id).options(selectinload(Message.sender))
    )
    msg = res.scalar_one()
    out = _serialize_message(msg)

    # Realtime push
    if other_user_id:
        await manager.send_personal(other_user_id, {
            "type": "message.new",
            "conversation_id": conv.id,
            "message": out.model_dump(mode="json"),
        })
    # Echo to all sender devices too
    await manager.send_personal(current_user.id, {
        "type": "message.new",
        "conversation_id": conv.id,
        "message": out.model_dump(mode="json"),
    })

    return out


@router.post("/conversations/{conversation_id}/read", response_model=ApiMessage)
async def mark_read(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = res.scalar_one_or_none()
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await _ensure_participant(conv, current_user)

    if conv.user_id == current_user.id:
        conv.unread_for_user = 0
    else:
        conv.unread_for_admin = 0

    # Mark individual messages too
    await db.execute(
        update(Message)
        .where(Message.conversation_id == conv.id, Message.sender_id != current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    return ApiMessage(message="Marked as read")


@router.post("/conversations/{conversation_id}/close", response_model=ApiMessage)
async def close_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = res.scalar_one_or_none()
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await _ensure_participant(conv, current_user)
    conv.status = ConversationStatus.CLOSED
    await db.commit()
    return ApiMessage(message="Conversation closed")


@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == UserRole.ADMIN:
        q = select(func.coalesce(func.sum(Conversation.unread_for_admin), 0)).where(
            or_(
                Conversation.admin_id == current_user.id,
                Conversation.admin_id.is_(None),
            )
        )
    else:
        q = select(func.coalesce(func.sum(Conversation.unread_for_user), 0)).where(
            Conversation.user_id == current_user.id
        )
    total = (await db.execute(q)).scalar() or 0
    return {"unread_count": int(total)}


# Admin-only inbox of everything
@router.get("/admin/inbox", response_model=ConversationListResponse)
async def admin_inbox(
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.user), selectinload(Conversation.admin))
        .order_by(Conversation.last_message_at.desc().nulls_last())
    )
    convs = res.scalars().all()
    items = [_serialize_conversation(c, current_user.id) for c in convs]
    return ConversationListResponse(
        conversations=items,
        total=len(items),
        total_unread=sum(c.unread_for_admin for c in convs),
    )


# ---------------------------------------------------------------------------
# WebSocket: realtime delivery for the current user.
# Authenticates via `?token=<JWT>` because browsers can't send custom
# headers on WebSocket connections.
# ---------------------------------------------------------------------------
@router.websocket("/ws")
async def chat_ws(websocket: WebSocket, token: str = Query(...)):
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        await websocket.close(code=1008)
        return
    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=1008)
        return

    # Validate that the user still exists
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.id == user_id))
        user = res.scalar_one_or_none()
        if user is None:
            await websocket.close(code=1008)
            return

    await manager.connect(user_id, websocket)
    try:
        # Greet
        await websocket.send_json({"type": "connected", "user_id": user_id})
        while True:
            data = await websocket.receive_text()
            try:
                event = json.loads(data)
            except Exception:
                continue
            etype = event.get("type")
            # Lightweight client-driven events: typing indicators, presence pings
            if etype == "typing":
                conv_id = event.get("conversation_id")
                is_typing = bool(event.get("is_typing", False))
                # Forward to the other participant
                if conv_id:
                    async with AsyncSessionLocal() as db:
                        res = await db.execute(
                            select(Conversation).where(Conversation.id == conv_id)
                        )
                        conv = res.scalar_one_or_none()
                    if conv:
                        other = conv.admin_id if conv.user_id == user_id else conv.user_id
                        if other:
                            await manager.send_personal(other, {
                                "type": "typing",
                                "conversation_id": conv_id,
                                "from": user_id,
                                "is_typing": is_typing,
                            })
            elif etype == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(user_id, websocket)
