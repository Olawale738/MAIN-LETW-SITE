"""
Pastoral care CRM admin endpoints.

Endpoints are admin-only — pastoral notes and life events contain sensitive
member information.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.pastoral_care import PastoralNote, LifeEventEntry
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/pastoral-care", tags=["Pastoral Care"])


KINDS = ["visitation", "call", "hospital", "bereavement", "counsel", "celebration", "prayer", "concern"]
LIFE_KINDS = ["baptism", "marriage", "baby", "new_role", "bereavement", "salvation", "health", "other"]


class NoteIn(BaseModel):
    member_user_id: Optional[str] = None
    member_name: str
    member_email: Optional[str] = None
    kind: str = "visitation"
    title: str
    body: str
    follow_up_on: Optional[datetime] = None


class NotePatch(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    kind: Optional[str] = None
    follow_up_on: Optional[datetime] = None


def _note_dict(n: PastoralNote) -> dict:
    return {
        "id": n.id, "member_user_id": n.member_user_id, "member_name": n.member_name, "member_email": n.member_email,
        "kind": n.kind, "title": n.title, "body": n.body, "follow_up_on": n.follow_up_on,
        "written_by_user_id": n.written_by_user_id, "is_confidential": n.is_confidential,
        "created_at": n.created_at, "updated_at": n.updated_at,
    }


# ─── Pastoral notes ──────────────────────────────────────────────────────────

@router.get("/notes")
async def list_notes(
    q: Optional[str] = None, kind: Optional[str] = None,
    member_user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user),
):
    query = select(PastoralNote).order_by(desc(PastoralNote.created_at))
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.where(or_(PastoralNote.member_name.ilike(like), PastoralNote.title.ilike(like), PastoralNote.body.ilike(like)))
    if kind:
        query = query.where(PastoralNote.kind == kind)
    if member_user_id:
        query = query.where(PastoralNote.member_user_id == member_user_id)
    res = await db.execute(query.limit(1000))
    return [_note_dict(n) for n in res.scalars().all()]


@router.post("/notes", status_code=201)
async def create_note(body: NoteIn, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    if body.kind not in KINDS:
        raise HTTPException(400, f"kind must be one of {KINDS}")
    n = PastoralNote(**body.model_dump())
    n.written_by_user_id = admin.id
    db.add(n); await db.commit(); await db.refresh(n)
    return _note_dict(n)


@router.put("/notes/{nid}")
async def update_note(nid: str, body: NotePatch, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(PastoralNote).where(PastoralNote.id == nid))
    n = res.scalar_one_or_none()
    if not n:
        raise HTTPException(404, "Not found")
    if body.title is not None: n.title = body.title
    if body.body is not None: n.body = body.body
    if body.kind is not None:
        if body.kind not in KINDS:
            raise HTTPException(400, f"kind must be one of {KINDS}")
        n.kind = body.kind
    if body.follow_up_on is not None: n.follow_up_on = body.follow_up_on
    await db.commit(); await db.refresh(n)
    return _note_dict(n)


@router.delete("/notes/{nid}")
async def delete_note(nid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(PastoralNote).where(PastoralNote.id == nid))
    n = res.scalar_one_or_none()
    if not n:
        return {"deleted": 0}
    await db.delete(n); await db.commit()
    return {"deleted": 1}


# ─── Life event timeline ─────────────────────────────────────────────────────

class LifeIn(BaseModel):
    member_user_id: Optional[str] = None
    member_name: str
    kind: str
    summary: str
    event_on: datetime


@router.get("/life-events")
async def list_life_events(member_user_id: Optional[str] = None, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    query = select(LifeEventEntry).order_by(desc(LifeEventEntry.event_on))
    if member_user_id:
        query = query.where(LifeEventEntry.member_user_id == member_user_id)
    res = await db.execute(query.limit(500))
    return [{
        "id": e.id, "member_user_id": e.member_user_id, "member_name": e.member_name,
        "kind": e.kind, "summary": e.summary, "event_on": e.event_on, "created_at": e.created_at,
    } for e in res.scalars().all()]


@router.post("/life-events", status_code=201)
async def create_life_event(body: LifeIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    if body.kind not in LIFE_KINDS:
        raise HTTPException(400, f"kind must be one of {LIFE_KINDS}")
    e = LifeEventEntry(**body.model_dump())
    db.add(e); await db.commit(); await db.refresh(e)
    return {"id": e.id, "member_name": e.member_name, "kind": e.kind, "summary": e.summary, "event_on": e.event_on, "created_at": e.created_at}


@router.delete("/life-events/{eid}")
async def delete_life_event(eid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(LifeEventEntry).where(LifeEventEntry.id == eid))
    e = res.scalar_one_or_none()
    if not e:
        return {"deleted": 0}
    await db.delete(e); await db.commit()
    return {"deleted": 1}
