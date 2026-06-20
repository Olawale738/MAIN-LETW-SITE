"""
Global Online Campus API — real church experience for online attendees.
"""

from datetime import datetime, date as date_type
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.online_campus import OnlineService, AltarCallResponse, RaiseHand, OnlineCommunion
from utils.dependencies import get_admin_user, get_current_active_user
from utils.rate_limit import rate_limit


router = APIRouter(prefix="/api/online-campus", tags=["Online Campus"])


# ─── Live service state ──────────────────────────────────────────────────────

class ServiceIn(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_at: datetime
    livestream_url: Optional[str] = None
    chat_enabled: bool = True
    altar_call_open: bool = False
    raise_hand_enabled: bool = True
    cover_image_url: Optional[str] = None
    youtube_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    twitter_url: Optional[str] = None
    tiktok_url: Optional[str] = None


@router.get("/current")
async def current_service(db: AsyncSession = Depends(get_db)):
    """Public: returns the currently-live service, or the next upcoming one."""
    res = await db.execute(select(OnlineService).where(OnlineService.is_live == True).order_by(desc(OnlineService.started_at)).limit(1))
    live = res.scalar_one_or_none()
    if live:
        return _service_to_dict(live, status="live")
    res2 = await db.execute(
        select(OnlineService).where(OnlineService.scheduled_at >= datetime.utcnow()).order_by(OnlineService.scheduled_at).limit(1)
    )
    upcoming = res2.scalar_one_or_none()
    if upcoming:
        return _service_to_dict(upcoming, status="upcoming")
    return {"status": "none"}


def _service_to_dict(s: OnlineService, status: str = "scheduled") -> dict:
    return {
        "status": status,
        "id": s.id, "title": s.title, "description": s.description,
        "scheduled_at": s.scheduled_at, "is_live": s.is_live,
        "livestream_url": s.livestream_url,
        "chat_enabled": s.chat_enabled,
        "altar_call_open": s.altar_call_open,
        "raise_hand_enabled": s.raise_hand_enabled,
        "viewer_count": s.viewer_count,
        "started_at": s.started_at,
        "ended_at": getattr(s, "ended_at", None),
        "cover_image_url": getattr(s, "cover_image_url", None),
        "youtube_url": getattr(s, "youtube_url", None),
        "facebook_url": getattr(s, "facebook_url", None),
        "instagram_url": getattr(s, "instagram_url", None),
        "twitter_url": getattr(s, "twitter_url", None),
        "tiktok_url": getattr(s, "tiktok_url", None),
        "sermon_id": getattr(s, "sermon_id", None),
        "event_id": getattr(s, "event_id", None),
    }


@router.get("/services")
async def list_services(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(OnlineService).order_by(desc(OnlineService.scheduled_at)).limit(50))
    return [_service_to_dict(s) for s in res.scalars().all()]


@router.post("/services", status_code=201)
async def create_service(body: ServiceIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    s = OnlineService(**body.model_dump())
    db.add(s)
    await db.flush()  # get s.id
    # Auto-create matching Event on /events page so the public sees it
    try:
        from models.event import Event
        e = Event(
            title=s.title,
            description=(s.description or "") + "\n\nWatch live at letw.org/live",
            event_date=s.scheduled_at.date(),
            start_time=s.scheduled_at.strftime("%H:%M"),
            location="Online · Light Encounter Tabernacle Worldwide",
            event_type="Online Service",
            is_published=True,
            is_featured=False,
            registration_required=False,
            registration_link="/live",
        )
        db.add(e)
        await db.flush()
        s.event_id = e.id
    except Exception:
        pass
    await db.commit()
    await db.refresh(s)
    return _service_to_dict(s)


@router.delete("/services/{sid}")
async def delete_service(sid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(OnlineService).where(OnlineService.id == sid))
    s = res.scalar_one_or_none()
    if not s:
        return {"deleted": 0}
    if s.is_live:
        raise HTTPException(400, "End the live service before deleting it.")
    # Also delete the linked Event if it exists
    event_id = getattr(s, "event_id", None)
    if event_id:
        try:
            from models.event import Event
            res2 = await db.execute(select(Event).where(Event.id == event_id))
            e = res2.scalar_one_or_none()
            if e:
                await db.delete(e)
        except Exception:
            pass
    await db.delete(s)
    await db.commit()
    return {"deleted": 1}


@router.put("/services/{sid}")
async def update_service(sid: str, body: ServiceIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(OnlineService).where(OnlineService.id == sid))
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Service not found")
    for k, v in body.model_dump().items():
        setattr(s, k, v)
    await db.commit()
    await db.refresh(s)
    return _service_to_dict(s)


class StateIn(BaseModel):
    is_live: Optional[bool] = None
    altar_call_open: Optional[bool] = None
    raise_hand_enabled: Optional[bool] = None
    viewer_count: Optional[int] = None


@router.post("/services/{sid}/state")
async def update_state(sid: str, body: StateIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Quick toggle endpoints during a service — go live, open altar call, etc."""
    res = await db.execute(select(OnlineService).where(OnlineService.id == sid))
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Service not found")
    if body.is_live is not None:
        if body.is_live and not s.is_live:
            s.started_at = datetime.utcnow()
        elif not body.is_live and s.is_live:
            s.ended_at = datetime.utcnow()
            # Auto-create a Sermon entry so the recording lands on /sermons
            try:
                if not getattr(s, "sermon_id", None) and s.livestream_url:
                    from models.sermon import Sermon
                    sermon = Sermon(
                        title=s.title,
                        description=(s.description or "") + "\n\nRecorded live at letw.org/live",
                        preacher="Light Encounter Tabernacle Worldwide",
                        sermon_date=(s.started_at or datetime.utcnow()).date(),
                        series="Live Services",
                        video_url=s.livestream_url,
                        is_featured=True,
                        is_published=True,
                    )
                    db.add(sermon)
                    await db.flush()
                    s.sermon_id = sermon.id
            except Exception:
                pass
        s.is_live = body.is_live
    if body.altar_call_open is not None:
        s.altar_call_open = body.altar_call_open
    if body.raise_hand_enabled is not None:
        s.raise_hand_enabled = body.raise_hand_enabled
    if body.viewer_count is not None:
        s.viewer_count = body.viewer_count
    await db.commit()
    await db.refresh(s)
    return _service_to_dict(s)


# ─── Altar call responses (public submit) ────────────────────────────────────

class AltarCallIn(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    kind: str = "salvation"
    note: Optional[str] = None
    service_id: Optional[str] = None


@router.post("/altar-call", status_code=201)
async def respond_to_altar_call(
    body: AltarCallIn,
    db: AsyncSession = Depends(get_db),
    _rl=Depends(rate_limit(3, 600, "altar-call")),
):
    r = AltarCallResponse(**body.model_dump())
    db.add(r)
    # Also auto-record in decisions tracker if it's a salvation/rededication/healing
    try:
        from models.decision import Decision
        kind_map = {
            "salvation": "salvation",
            "rededication": "rededication",
            "prayer_for_healing": "healing",
            "baptism_request": "baptism",
        }
        if body.kind in kind_map:
            d = Decision(
                kind=kind_map[body.kind],
                person_name=body.name,
                person_email=body.email,
                location=body.location or "Online service",
                notes=body.note,
                is_public=False,  # admin verifies first
            )
            db.add(d)
    except Exception:
        pass
    await db.commit()
    await db.refresh(r)
    return {"ok": True, "id": r.id, "message": "Heaven is rejoicing. We'll reach out to walk this with you."}


@router.get("/altar-call/responses")
async def list_altar_responses(
    pending_only: bool = False,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(AltarCallResponse).order_by(desc(AltarCallResponse.created_at)).limit(500)
    if pending_only:
        q = q.where(AltarCallResponse.followed_up == False)
    res = await db.execute(q)
    return [{
        "id": r.id, "name": r.name, "email": r.email, "phone": r.phone,
        "location": r.location, "kind": r.kind, "note": r.note,
        "followed_up": r.followed_up, "followed_up_at": r.followed_up_at,
        "created_at": r.created_at, "service_id": r.service_id,
    } for r in res.scalars().all()]


@router.put("/altar-call/{rid}/follow-up")
async def mark_followed_up(rid: str, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    res = await db.execute(select(AltarCallResponse).where(AltarCallResponse.id == rid))
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Not found")
    r.followed_up = True
    r.followed_up_at = datetime.utcnow()
    r.followed_up_by = admin.id
    await db.commit()
    return {"ok": True}


# ─── Raise hand (live pastoral attention) ────────────────────────────────────

class RaiseHandIn(BaseModel):
    display_name: str = "Online attendee"
    message: Optional[str] = None
    service_id: Optional[str] = None


@router.post("/raise-hand", status_code=201)
async def raise_hand(
    body: RaiseHandIn,
    db: AsyncSession = Depends(get_db),
    _rl=Depends(rate_limit(5, 300, "raise-hand")),
):
    r = RaiseHand(**body.model_dump())
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return {"ok": True, "id": r.id, "status": r.status}


@router.get("/raise-hand/queue")
async def queue(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(
        select(RaiseHand).where(RaiseHand.status != "closed").order_by(RaiseHand.created_at)
    )
    return [{
        "id": r.id, "display_name": r.display_name, "message": r.message,
        "status": r.status, "created_at": r.created_at,
    } for r in res.scalars().all()]


class RaiseHandUpdate(BaseModel):
    status: str  # attending | closed


@router.put("/raise-hand/{rid}")
async def update_raise_hand(rid: str, body: RaiseHandUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(RaiseHand).where(RaiseHand.id == rid))
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Not found")
    r.status = body.status
    if body.status == "closed":
        r.resolved_at = datetime.utcnow()
    await db.commit()
    return {"ok": True, "status": r.status}


# ─── Online Communion ────────────────────────────────────────────────────────

class CommunionIn(BaseModel):
    name: str
    email: EmailStr
    requested_date: date_type
    timezone: Optional[str] = None
    note: Optional[str] = None


@router.post("/communion", status_code=201)
async def request_communion(
    body: CommunionIn,
    db: AsyncSession = Depends(get_db),
    _rl=Depends(rate_limit(3, 3600, "communion")),
):
    c = OnlineCommunion(**body.model_dump())
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return {"ok": True, "id": c.id, "message": "An online pastor will confirm your communion appointment within 48 hours."}


@router.get("/communion")
async def list_communion(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(OnlineCommunion).order_by(desc(OnlineCommunion.created_at)).limit(200)
    if status:
        q = q.where(OnlineCommunion.status == status)
    res = await db.execute(q)
    return [{
        "id": c.id, "name": c.name, "email": c.email,
        "requested_date": c.requested_date, "timezone": c.timezone,
        "note": c.note, "status": c.status, "confirmed_datetime": c.confirmed_datetime,
        "created_at": c.created_at,
    } for c in res.scalars().all()]


class CommunionUpdate(BaseModel):
    status: str  # confirmed | completed | cancelled
    confirmed_datetime: Optional[datetime] = None


@router.put("/communion/{cid}")
async def update_communion(cid: str, body: CommunionUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    res = await db.execute(select(OnlineCommunion).where(OnlineCommunion.id == cid))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Not found")
    c.status = body.status
    if body.confirmed_datetime:
        c.confirmed_datetime = body.confirmed_datetime
        c.confirmed_by_user_id = admin.id
    await db.commit()
    return {"ok": True, "status": c.status}
