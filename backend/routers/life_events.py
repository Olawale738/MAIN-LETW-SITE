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


@router.put("/{rid}", response_model=RequestOut)
async def update_request(rid: str, body: RequestUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(LifeEventRequest).where(LifeEventRequest.id == rid))
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    await db.commit()
    await db.refresh(r)
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
