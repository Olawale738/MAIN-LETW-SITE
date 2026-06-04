"""
Choir group chat — live polling-based group message room.
No user authentication required; sender identity is carried in the request body.
Supports up to 200 messages in history; older messages are auto-pruned.
Also provides roster and song-library sync endpoints for the Choirmaster portal.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func as sqlfunc

from database import get_db
from models.choir_chat import ChoirGroupMessage, ChoirMember, ChoirSong
from models.user import User, UserRole
from utils.dependencies import get_current_active_user

router = APIRouter(prefix="/api/choir-chat", tags=["Choir Chat"])

# Simple secret used by the Choirmaster portal when writing to the DB.
# Matches the default choirmaster login password so no extra config is needed.
DIRECTOR_KEY = "LETW@Choir2026"

MAX_MESSAGES = 200  # keep chat history manageable


# ─── Schemas ────────────────────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: str
    sender_name: str
    sender_initials: str
    voice_part: str
    is_director: bool
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    sender_name: str
    sender_initials: str
    voice_part: str          # "Director" | "Soprano" | "Alto" | "Tenor" | "Bass"
    is_director: bool = False
    content: str


# ─── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/messages", response_model=list[MessageOut])
async def get_messages(
    since: Optional[str] = None,   # ISO timestamp — returns only newer messages
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """
    Poll for choir group chat messages.
    Pass ?since=<ISO timestamp> to get only messages newer than that time.
    """
    query = select(ChoirGroupMessage).order_by(ChoirGroupMessage.created_at.desc()).limit(limit)

    if since:
        try:
            since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
            query = select(ChoirGroupMessage).where(
                ChoirGroupMessage.created_at > since_dt
            ).order_by(ChoirGroupMessage.created_at.asc())
        except ValueError:
            pass  # bad timestamp — return all

    result = await db.execute(query)
    messages = result.scalars().all()

    # If we fetched without `since`, reverse to get chronological order
    if not since:
        messages = list(reversed(messages))

    return messages


@router.post("/messages", response_model=MessageOut, status_code=201)
async def send_message(
    body: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a message to the choir group chat."""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if not body.sender_name.strip():
        raise HTTPException(status_code=400, detail="Sender name required")

    msg = ChoirGroupMessage(
        sender_name=body.sender_name.strip(),
        sender_initials=body.sender_initials.strip()[:4],
        voice_part=body.voice_part.strip(),
        is_director=body.is_director,
        content=body.content.strip(),
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    # Prune old messages to keep the table lean
    count_result = await db.execute(select(sqlfunc.count(ChoirGroupMessage.id)))
    total = count_result.scalar() or 0
    if total > MAX_MESSAGES:
        # Delete the oldest messages beyond the limit
        subq = (
            select(ChoirGroupMessage.id)
            .order_by(ChoirGroupMessage.created_at.asc())
            .limit(total - MAX_MESSAGES)
            .scalar_subquery()
        )
        await db.execute(delete(ChoirGroupMessage).where(ChoirGroupMessage.id.in_(subq)))
        await db.commit()

    return msg


@router.delete("/messages/{msg_id}")
async def delete_choir_message(
    msg_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Admin: delete a single choir chat message."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required.")
    result = await db.execute(
        select(ChoirGroupMessage).where(ChoirGroupMessage.id == msg_id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    await db.delete(msg)
    await db.commit()
    return {"message": "Message deleted."}


@router.delete("/messages/clear")
async def clear_messages(db: AsyncSession = Depends(get_db)):
    """Clear all choir chat messages (director action)."""
    await db.execute(delete(ChoirGroupMessage))
    await db.commit()
    return {"message": "Chat cleared"}


# ─── Member Roster ───────────────────────────────────────────────────────────

class MemberOut(BaseModel):
    id: str
    name: str
    initials: str
    voice: str
    role: Optional[str] = None
    active: bool

    class Config:
        from_attributes = True


class SyncRosterRequest(BaseModel):
    director_key: str
    members: list[dict]


@router.get("/roster", response_model=list[MemberOut])
async def get_roster(db: AsyncSession = Depends(get_db)):
    """Get the registered choir member roster (public — no auth required)."""
    result = await db.execute(
        select(ChoirMember).order_by(ChoirMember.created_at.asc())
    )
    return result.scalars().all()


@router.post("/roster/sync", status_code=200)
async def sync_roster(body: SyncRosterRequest, db: AsyncSession = Depends(get_db)):
    """
    Replace the entire member roster.
    Called by the Choirmaster portal whenever a member is added or removed.
    Requires the director key.
    """
    if body.director_key != DIRECTOR_KEY:
        raise HTTPException(status_code=403, detail="Invalid director key")

    await db.execute(delete(ChoirMember))
    for m in body.members:
        db.add(ChoirMember(
            id=str(m.get("id") or uuid.uuid4()),
            name=str(m.get("name", "")).strip(),
            initials=str(m.get("initials", "")).strip()[:4],
            voice=str(m.get("voice", "Soprano")).strip(),
            role=str(m["role"]).strip() if m.get("role") else None,
            active=bool(m.get("active", True)),
        ))
    await db.commit()
    return {"synced": len(body.members)}


# ─── Song Library ────────────────────────────────────────────────────────────

class SongOut(BaseModel):
    id: str
    title: str
    key: Optional[str] = None
    tempo: Optional[str] = None
    voice_part: Optional[str] = None
    category: Optional[str] = None
    lyrics_url: Optional[str] = None
    sheet_url: Optional[str] = None
    track_url: Optional[str] = None

    class Config:
        from_attributes = True


class SyncSongsRequest(BaseModel):
    director_key: str
    songs: list[dict]


@router.get("/songs", response_model=list[SongOut])
async def get_songs(db: AsyncSession = Depends(get_db)):
    """Get the choir song library (public — no auth required)."""
    result = await db.execute(
        select(ChoirSong).order_by(ChoirSong.position.asc(), ChoirSong.created_at.asc())
    )
    return result.scalars().all()


@router.post("/songs/sync", status_code=200)
async def sync_songs(body: SyncSongsRequest, db: AsyncSession = Depends(get_db)):
    """
    Replace the entire song library.
    Called by the Choirmaster portal whenever song links are updated.
    Requires the director key.
    """
    if body.director_key != DIRECTOR_KEY:
        raise HTTPException(status_code=403, detail="Invalid director key")

    await db.execute(delete(ChoirSong))
    for i, s in enumerate(body.songs):
        voice_part = str(s.get("voicePart") or s.get("voice_part") or "").strip() or None
        db.add(ChoirSong(
            id=str(s.get("id") or uuid.uuid4()),
            title=str(s.get("title", "")).strip(),
            key=str(s["key"]).strip() if s.get("key") else None,
            tempo=str(s["tempo"]).strip() if s.get("tempo") else None,
            voice_part=voice_part,
            category=str(s["category"]).strip() if s.get("category") else None,
            lyrics_url=str(s["lyrics_url"]).strip() if s.get("lyrics_url") else None,
            sheet_url=str(s["sheet_url"]).strip() if s.get("sheet_url") else None,
            track_url=str(s["track_url"]).strip() if s.get("track_url") else None,
            position=i,
        ))
    await db.commit()
    return {"synced": len(body.songs)}
