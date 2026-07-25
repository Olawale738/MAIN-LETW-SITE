"""
SMS admin API — register/activate an SMS provider and send a test message.
All endpoints admin-only. Secret keys are masked on read.
"""

from datetime import datetime
from typing import List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.sms import SmsProvider
from models.user import User
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/sms", tags=["SMS"])


def _mask(v: Optional[str]) -> Optional[str]:
    if not v:
        return None
    if len(v) <= 6:
        return "•" * len(v)
    return v[:3] + "•" * (len(v) - 6) + v[-3:]


class ProviderIn(BaseModel):
    provider: str = "termii"          # termii|twilio|africastalking|custom
    name: str = "SMS"
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    sender_id: Optional[str] = None
    base_url: Optional[str] = None
    config: Optional[Any] = None
    is_active: bool = False


def _out(p: SmsProvider) -> dict:
    return {
        "id": p.id, "provider": p.provider, "name": p.name,
        "api_key": _mask(p.api_key), "api_secret": _mask(p.api_secret),
        "sender_id": p.sender_id, "base_url": p.base_url,
        "config": p.config or {}, "is_active": p.is_active,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.get("/status")
async def sms_status(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    active = (await db.execute(select(SmsProvider).where(SmsProvider.is_active == True))).scalars().first()  # noqa: E712
    return {"configured": active is not None, "provider": active.provider if active else None,
            "sender_id": active.sender_id if active else None}


@router.get("/providers")
async def list_providers(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    rows = (await db.execute(select(SmsProvider).order_by(SmsProvider.created_at))).scalars().all()
    return [_out(p) for p in rows]


async def _deactivate_others(db: AsyncSession, keep_id: Optional[str]):
    """Only one active provider at a time."""
    await db.execute(update(SmsProvider).where(SmsProvider.id != (keep_id or "")).values(is_active=False))


@router.post("/providers", status_code=201)
async def create_provider(body: ProviderIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    p = SmsProvider(**body.model_dump())
    db.add(p)
    await db.flush()
    if p.is_active:
        await _deactivate_others(db, p.id)
    await db.commit()
    await db.refresh(p)
    return _out(p)


@router.put("/providers/{pid}")
async def update_provider(pid: str, body: ProviderIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    p = (await db.execute(select(SmsProvider).where(SmsProvider.id == pid))).scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Provider not found")
    data = body.model_dump()
    # Keep existing secret if the form sent back a masked value.
    for secret in ("api_key", "api_secret"):
        v = data.get(secret)
        if v is not None and "•" in v:
            data[secret] = getattr(p, secret)
    for k, v in data.items():
        setattr(p, k, v)
    if p.is_active:
        await _deactivate_others(db, p.id)
    await db.commit()
    await db.refresh(p)
    return _out(p)


@router.delete("/providers/{pid}")
async def delete_provider(pid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    p = (await db.execute(select(SmsProvider).where(SmsProvider.id == pid))).scalar_one_or_none()
    if p:
        await db.delete(p)
        await db.commit()
    return {"deleted": 1 if p else 0}


class TestIn(BaseModel):
    to: str
    message: str = "Test SMS from Light Encounter Tabernacle Worldwide. If you got this, SMS is working."


@router.post("/test")
async def send_test(body: TestIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    from services.sms_service import send_sms
    ok, detail = await send_sms(db, body.to, body.message)
    return {"sent": ok, "detail": detail}


@router.get("/audience")
async def audience_count(status: Optional[str] = None, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """How many members would receive a broadcast (those with a phone on file)."""
    from models.user import User as U, UserStatus
    q = select(U).where(U.phone.isnot(None), U.phone != "")
    if status == "active":
        q = q.where(U.status == UserStatus.ACTIVE)
    rows = (await db.execute(q)).scalars().all()
    return {"count": len([u for u in rows if (u.phone or '').strip()])}


class BroadcastIn(BaseModel):
    message: str
    audience: str = "all"   # all | active


@router.post("/broadcast")
async def broadcast(body: BroadcastIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Text every member who has a phone number. Sends sequentially and reports
    a tally. Requires an active SMS provider."""
    msg = (body.message or "").strip()
    if not msg:
        raise HTTPException(400, "Message is empty.")
    from services.sms_service import send_sms, _active_provider
    if not await _active_provider(db):
        raise HTTPException(400, "No active SMS provider — add and activate one first.")
    from models.user import User as U, UserStatus
    q = select(U).where(U.phone.isnot(None), U.phone != "")
    if body.audience == "active":
        q = q.where(U.status == UserStatus.ACTIVE)
    members = [u for u in (await db.execute(q)).scalars().all() if (u.phone or '').strip()]
    sent, failed = 0, 0
    for u in members:
        ok, _detail = await send_sms(db, u.phone, msg)
        if ok:
            sent += 1
        else:
            failed += 1
    return {"recipients": len(members), "sent": sent, "failed": failed}
