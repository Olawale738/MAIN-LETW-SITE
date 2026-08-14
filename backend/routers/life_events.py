"""
Life Event Requests — weddings / baptisms / dedications / funerals.
"""

from datetime import datetime, date
from typing import List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from utils.rate_limit import rate_limit
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.life_event import LifeEventRequest
from models.user import User
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/life-events", tags=["Life Events"])

KINDS = {"wedding", "baptism", "dedication", "funeral"}


class RequestIn(BaseModel):
    kind: str
    requester_name: str
    requester_email: EmailStr
    requester_phone: Optional[str] = None
    preferred_date: date
    alternate_date: Optional[date] = None
    details: Optional[Any] = None


class RequestOut(BaseModel):
    id: str
    kind: str
    requester_name: str
    requester_email: str
    requester_phone: Optional[str]
    preferred_date: date
    alternate_date: Optional[date]
    details: Optional[Any]
    status: str
    admin_notes: Optional[str]
    approved_date: Optional[date]
    certificate_number: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime


@router.post("/", response_model=RequestOut, status_code=201)
async def submit_request(
    body: RequestIn,
    db: AsyncSession = Depends(get_db),
    _rl=Depends(rate_limit(3, 600, "life-events")),  # 3 requests / 10 min / IP
):
    if body.kind not in KINDS:
        raise HTTPException(400, f"kind must be one of {sorted(KINDS)}")
    r = LifeEventRequest(**body.model_dump())
    db.add(r)
    await db.commit()
    await db.refresh(r)

    # Same notification pattern as sanctuary: acknowledge the requester, page
    # the pastor inbox. Never poison the request on mail hiccups.
    reference = r.id.split("-")[0].upper()
    try:
        from services.email_service import (
            send_life_event_received,
            send_life_event_admin_notice,
            _admin_notify_email,
        )
        await send_life_event_received(
            to_email=r.requester_email, name=r.requester_name,
            kind=r.kind, preferred_date=r.preferred_date,
            reference=reference,
        )
        admin_email = await _admin_notify_email()
        await send_life_event_admin_notice(
            admin_email=admin_email,
            requester_name=r.requester_name, requester_email=r.requester_email,
            kind=r.kind, preferred_date=r.preferred_date,
            reference=reference,
        )
    except Exception as e:
        print(f"[life-events] receipt emails failed: {type(e).__name__}: {e}", flush=True)

    return r


@router.get("/", response_model=List[RequestOut])
async def list_requests(
    status: Optional[str] = None,
    kind: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(LifeEventRequest).order_by(LifeEventRequest.created_at.desc())
    if status:
        q = q.where(LifeEventRequest.status == status)
    if kind:
        q = q.where(LifeEventRequest.kind == kind)
    res = await db.execute(q)
    return res.scalars().all()


class RequestUpdate(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None
    approved_date: Optional[date] = None
    photo_url: Optional[str] = None


@router.put("/{rid}", response_model=RequestOut)
async def update_request(rid: str, body: RequestUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(LifeEventRequest).where(LifeEventRequest.id == rid))
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    # A baptism that becomes approved/completed gets a certificate number and is
    # pushed to the partner system (sharepoints) to issue the baptism certificate.
    if r.kind == "baptism" and r.status in ("approved", "completed") and not r.certificate_number:
        from routers.integrations import _make_baptism_number
        r.certificate_number = _make_baptism_number(r.id)
    await db.commit()
    await db.refresh(r)

    if r.kind == "baptism" and body.status in ("approved", "completed") and r.certificate_number:
        try:
            from routers.integrations import push_baptism_completion
            await push_baptism_completion(db, r)
        except Exception as e:
            print(f"[life-events] baptism partner push failed: {type(e).__name__}: {e}", flush=True)

    # Fan out decision emails on approve / decline transitions only.
    if body.status in {"approved", "declined"} and r.requester_email:
        try:
            from services.email_service import send_life_event_decision
            await send_life_event_decision(
                to_email=r.requester_email, name=r.requester_name,
                kind=r.kind, decision=body.status,
                approved_date=r.approved_date, admin_note=r.admin_notes,
            )
        except Exception as e:
            print(f"[life-events] decision email failed: {type(e).__name__}: {e}", flush=True)

    return r


@router.delete("/{rid}")
async def delete_request(rid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(LifeEventRequest).where(LifeEventRequest.id == rid))
    r = res.scalar_one_or_none()
    if not r:
        return {"deleted": 0}
    await db.delete(r)
    await db.commit()
    return {"deleted": 1}
