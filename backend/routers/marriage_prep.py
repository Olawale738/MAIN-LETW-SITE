"""
Marriage Prep router.

Admin owns the curriculum (modules) and approves couples + signs off at the end.
Couples enrol publicly, work through modules, log reflections, request sign-off.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.marriage_prep import MarriagePrepModule, MarriagePrepCouple, MarriagePrepProgress
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/marriage-prep", tags=["Marriage Prep"])


# ── Public: modules + couple flow ──────────────────────────────────────────

@router.get("/modules")
async def list_modules(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(MarriagePrepModule).where(MarriagePrepModule.is_published == True).order_by(MarriagePrepModule.week_number)  # noqa: E712
    )
    return [_module(m) for m in res.scalars().all()]


class CoupleIn(BaseModel):
    partner_a_name:     str
    partner_a_email:    EmailStr
    partner_b_name:     str
    partner_b_email:    Optional[EmailStr] = None
    intended_wedding_date: Optional[datetime] = None


@router.post("/enrol", status_code=201)
async def enrol_couple(body: CoupleIn, db: AsyncSession = Depends(get_db)):
    c = MarriagePrepCouple(**body.model_dump())
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return _couple(c)


class ProgressIn(BaseModel):
    couple_id:   str
    module_id:   str
    reflections: Optional[str] = None
    completed:   bool = True


@router.post("/progress")
async def log_progress(body: ProgressIn, db: AsyncSession = Depends(get_db)):
    # Validate FKs.
    if not (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == body.couple_id))).scalar_one_or_none():
        raise HTTPException(404, "Couple not found")
    if not (await db.execute(select(MarriagePrepModule).where(MarriagePrepModule.id == body.module_id))).scalar_one_or_none():
        raise HTTPException(404, "Module not found")
    # Upsert.
    existing = (await db.execute(
        select(MarriagePrepProgress)
        .where(and_(MarriagePrepProgress.couple_id == body.couple_id, MarriagePrepProgress.module_id == body.module_id))
    )).scalar_one_or_none()
    if existing:
        existing.reflections = body.reflections
        existing.completed_at = datetime.utcnow() if body.completed else None
    else:
        existing = MarriagePrepProgress(
            couple_id=body.couple_id, module_id=body.module_id,
            reflections=body.reflections,
            completed_at=datetime.utcnow() if body.completed else None,
        )
        db.add(existing)
    # If we just completed the last module, move couple to in_progress→completed
    # only the pastor sign-off transitions to completed, but flip in_progress now.
    c = (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == body.couple_id))).scalar_one()
    if c.status == "enrolled":
        c.status = "in_progress"
    await db.commit()
    await db.refresh(existing)
    return _progress(existing)


@router.get("/couples/{couple_id}/progress")
async def get_couple_progress(couple_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(MarriagePrepProgress).where(MarriagePrepProgress.couple_id == couple_id))
    return [_progress(p) for p in res.scalars().all()]


# ── Admin: modules CRUD + sign-off ─────────────────────────────────────────

class ModuleIn(BaseModel):
    week_number:  int
    title:        str
    summary:      Optional[str] = None
    body_html:    Optional[str] = None
    scripture:    Optional[str] = None
    homework:     Optional[str] = None
    is_published: bool = True


@router.post("/admin/modules", status_code=201)
async def create_module(body: ModuleIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    m = MarriagePrepModule(**body.model_dump())
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return _module(m)


@router.put("/admin/modules/{module_id}")
async def update_module(module_id: str, body: ModuleIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    m = (await db.execute(select(MarriagePrepModule).where(MarriagePrepModule.id == module_id))).scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Module not found")
    for k, v in body.model_dump().items():
        setattr(m, k, v)
    await db.commit()
    await db.refresh(m)
    return _module(m)


@router.delete("/admin/modules/{module_id}")
async def delete_module(module_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    m = (await db.execute(select(MarriagePrepModule).where(MarriagePrepModule.id == module_id))).scalar_one_or_none()
    if m:
        await db.delete(m)
        await db.commit()
    return {"deleted": 1 if m else 0}


@router.get("/admin/couples")
async def list_couples_admin(status: Optional[str] = None, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    q = select(MarriagePrepCouple).order_by(desc(MarriagePrepCouple.created_at))
    if status:
        q = q.where(MarriagePrepCouple.status == status)
    res = await db.execute(q.limit(500))
    return [_couple(c) for c in res.scalars().all()]


class SignOffIn(BaseModel):
    pastor_signature: str
    pastor_note:      Optional[str] = None


@router.post("/admin/couples/{couple_id}/sign-off")
async def pastor_sign_off(
    couple_id: str,
    body: SignOffIn,
    db: AsyncSession = Depends(get_db),
    pastor: User = Depends(get_admin_user),
):
    c = (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == couple_id))).scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Couple not found")
    c.pastor_signed_off = True
    c.pastor_signed_at = datetime.utcnow()
    c.pastor_signature = body.pastor_signature
    c.pastor_note      = body.pastor_note
    c.assigned_pastor_user_id = pastor.id
    c.status = "completed"
    await db.commit()
    await db.refresh(c)

    # Notify both partners with a link to their certificate + next steps.
    # Best-effort — a mail hiccup must not roll back the sign-off itself.
    try:
        from services.email_service import send_marriage_prep_completion_email
        wedding_date = c.intended_wedding_date.strftime("%A, %B %d, %Y") if c.intended_wedding_date else ""
        for addr in [c.partner_a_email, c.partner_b_email]:
            if not addr:
                continue
            await send_marriage_prep_completion_email(
                to_email=addr,
                partner_a_name=c.partner_a_name or "",
                partner_b_name=c.partner_b_name or "",
                couple_id=c.id,
                pastor_signature=c.pastor_signature or "",
                pastor_note=c.pastor_note or "",
                wedding_date=wedding_date,
            )
    except Exception as e:
        print(f"[marriage-prep] completion email failed: {type(e).__name__}: {e}", flush=True)

    return _couple(c)


# ── Public certificate lookup — only the id is used (UUIDs are
#    unguessable enough for this use). Returns a minimal view: no
#    email addresses, no pastor's private note. Used by
#    /marriage-prep/complete/{id} on the frontend so the couple can
#    view + print their certificate.
@router.get("/certificate/{couple_id}")
async def get_certificate(couple_id: str, db: AsyncSession = Depends(get_db)):
    c = (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == couple_id))).scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Not found")
    if not c.pastor_signed_off:
        # Not signed off yet — don't expose a "certificate" for an
        # unfinished couple. Frontend can decide what to render.
        raise HTTPException(404, "Certificate not yet issued")
    return {
        "id":                c.id,
        "partner_a_name":    c.partner_a_name,
        "partner_b_name":    c.partner_b_name,
        "wedding_date":      c.intended_wedding_date.isoformat() if c.intended_wedding_date else None,
        "pastor_signature":  c.pastor_signature,
        "pastor_signed_at":  c.pastor_signed_at.isoformat() if c.pastor_signed_at else None,
        "status":            c.status,
    }


# ── Helpers ────────────────────────────────────────────────────────────────

def _module(m: MarriagePrepModule) -> dict[str, Any]:
    return {
        "id": m.id, "week_number": m.week_number, "title": m.title,
        "summary": m.summary, "body_html": m.body_html,
        "scripture": m.scripture, "homework": m.homework,
        "is_published": m.is_published,
    }


def _couple(c: MarriagePrepCouple) -> dict[str, Any]:
    return {
        "id": c.id,
        "partner_a_name": c.partner_a_name, "partner_a_email": c.partner_a_email,
        "partner_b_name": c.partner_b_name, "partner_b_email": c.partner_b_email,
        "intended_wedding_date": c.intended_wedding_date.isoformat() if c.intended_wedding_date else None,
        "assigned_pastor_user_id": c.assigned_pastor_user_id,
        "status": c.status, "pastor_signed_off": c.pastor_signed_off,
        "pastor_signed_at": c.pastor_signed_at.isoformat() if c.pastor_signed_at else None,
        "pastor_signature": c.pastor_signature, "pastor_note": c.pastor_note,
        "created_at": c.created_at.isoformat(),
    }


def _progress(p: MarriagePrepProgress) -> dict[str, Any]:
    return {
        "id": p.id, "couple_id": p.couple_id, "module_id": p.module_id,
        "completed_at": p.completed_at.isoformat() if p.completed_at else None,
        "reflections": p.reflections,
    }
