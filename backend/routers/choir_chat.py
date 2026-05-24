"""
Choir group chat — live polling-based group message room.
No user authentication required; sender identity is carried in the request body.
Supports up to 200 messages in history; older messages are auto-pruned.
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func as sqlfunc

from database import get_db
from models.choir_chat import ChoirGroupMessage

router = APIRouter(prefix="/api/choir-chat", tags=["Choir Chat"])

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


@router.delete("/messages/clear")
async def clear_messages(db: AsyncSession = Depends(get_db)):
    """Clear all choir chat messages (director action)."""
    await db.execute(delete(ChoirGroupMessage))
    await db.commit()
    return {"message": "Chat cleared"}
