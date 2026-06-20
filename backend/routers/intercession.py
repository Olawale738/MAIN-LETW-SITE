"""
Live Prayer Command Center API.
- Member submits a quick prayer request (anonymous option).
- Auto-routes to the next available intercessor (least-recently-assigned).
- Intercessor marks "praying" then "prayed" / "answered" with optional testimony.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.intercession import Intercessor, IntercessionRequest
from utils.dependencies import get_admin_user, get_current_active_user
from utils.rate_limit import rate_limit


router = APIRouter(prefix="/api/intercession", tags=["Live Prayer"])


class IntercessorIn(BaseModel):
    user_id: str
    display_name: str
    bio: Optional[str] = None
    languages: Optional[str] = None
    is_active: bool = True


class IntercessorOut(BaseModel):
    id: str
    user_id: str
    display_name: str
    bio: Optional[str]
    languages: Optional[str]
    is_active: bool
    is_available_now: bool
    total_prayed_for: int


# ─── Public: submit a request ────────────────────────────────────────────────

class RequestIn(BaseModel):
    text: str
    display_name: str = "A child of God"
    category: Optional[str] = None
    is_anonymous: bool = False


@router.post("/requests", status_code=201)
async def submit_intercession_request(
    body: RequestIn,
    db: AsyncSession = Depends(get_db),
    _rl=Depends(rate_limit(5, 600, "intercession")),  # 5 / 10 min / IP
):
    # Find an available intercessor: active + available + least-recently assigned
    res = await db.execute(
        select(Intercessor).where(
            Intercessor.is_active == True,
            Intercessor.is_available_now == True,
        ).order_by(Intercessor.last_assigned_at.asc().nulls_first())
    )
    intercessor = res.scalars().first()

    req = IntercessionRequest(
        is_anonymous=body.is_anonymous,
        display_name=body.display_name if not body.is_anonymous else "A child of God",
        category=body.category,
        text=body.text,
        intercessor_id=intercessor.id if intercessor else None,
        status="assigned" if intercessor else "waiting",
        assigned_at=datetime.utcnow() if intercessor else None,
    )
    db.add(req)
    if intercessor:
        intercessor.last_assigned_at = datetime.utcnow()
    await db.commit()
    await db.refresh(req)
    return {
        "ok": True,
        "request_id": req.id,
        "assigned_intercessor": intercessor.display_name if intercessor else None,
        "status": req.status,
        "message": (
            f"{intercessor.display_name} has been assigned to pray for you." if intercessor
            else "No intercessor is online right now — the next available one will pick this up shortly."
        ),
    }


@router.get("/online-count")
async def online_count(db: AsyncSession = Depends(get_db)):
    """Public: how many intercessors are online right now."""
    res = await db.execute(
        select(func.count(Intercessor.id)).where(
            Intercessor.is_active == True, Intercessor.is_available_now == True
        )
    )
    return {"online": res.scalar() or 0}


# ─── Intercessor self-service ────────────────────────────────────────────────

@router.get("/me")
async def me(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    res = await db.execute(select(Intercessor).where(Intercessor.user_id == user.id))
    i = res.scalar_one_or_none()
    if not i:
        return None
    return {
        "id": i.id, "display_name": i.display_name,
        "is_active": i.is_active, "is_available_now": i.is_available_now,
        "total_prayed_for": i.total_prayed_for,
    }


@router.post("/me/toggle-available")
async def toggle_available(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    res = await db.execute(select(Intercessor).where(Intercessor.user_id == user.id))
    i = res.scalar_one_or_none()
    if not i:
        raise HTTPException(404, "You are not on the intercessor rota.")
    i.is_available_now = not i.is_available_now
    await db.commit()
    return {"is_available_now": i.is_available_now}


@router.get("/me/queue")
async def my_queue(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    res = await db.execute(select(Intercessor).where(Intercessor.user_id == user.id))
    i = res.scalar_one_or_none()
    if not i:
        return []
    res2 = await db.execute(
        select(IntercessionRequest)
        .where(IntercessionRequest.intercessor_id == i.id)
        .where(IntercessionRequest.status.in_(["assigned", "praying"]))
        .order_by(IntercessionRequest.assigned_at)
        .limit(50)
    )
    return [{
        "id": r.id, "display_name": r.display_name, "text": r.text,
        "category": r.category, "status": r.status,
        "created_at": r.created_at, "assigned_at": r.assigned_at,
    } for r in res2.scalars().all()]


class StatusIn(BaseModel):
    status: str  # praying | answered | closed
    answered_testimony: Optional[str] = None


@router.put("/requests/{rid}/status")
async def update_request_status(
    rid: str, body: StatusIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    res = await db.execute(select(IntercessionRequest).where(IntercessionRequest.id == rid))
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Request not found")
    res2 = await db.execute(select(Intercessor).where(Intercessor.user_id == user.id))
    me = res2.scalar_one_or_none()
    if not me or r.intercessor_id != me.id:
        raise HTTPException(403, "Not your assigned request")
    r.status = body.status
    if body.status in ("answered", "closed"):
        r.closed_at = datetime.utcnow()
        me.total_prayed_for += 1
    if body.answered_testimony:
        r.answered_testimony = body.answered_testimony
    await db.commit()
    return {"ok": True, "status": r.status}


# ─── Admin: rota management ──────────────────────────────────────────────────

@router.get("/admin/candidates")
async def admin_candidate_search(
    q: str = "",
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Search members by name/email to add as intercessors — excludes already-rostered."""
    from sqlalchemy import or_
    # Subquery: users already on rota
    rostered = select(Intercessor.user_id).subquery()
    query = select(User).where(~User.id.in_(select(rostered.c.user_id)))
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.where(or_(User.name.ilike(like), User.email.ilike(like)))
    query = query.order_by(User.name).limit(25)
    res = await db.execute(query)
    return [{"id": u.id, "name": u.name, "email": u.email} for u in res.scalars().all()]


@router.get("/admin/intercessors", response_model=List[IntercessorOut])
async def admin_list(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(Intercessor).order_by(Intercessor.display_name))
    return res.scalars().all()


@router.post("/admin/intercessors", response_model=IntercessorOut, status_code=201)
async def admin_add(body: IntercessorIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    # Ensure user exists
    res = await db.execute(select(User).where(User.id == body.user_id))
    if not res.scalar_one_or_none():
        raise HTTPException(404, "User not found")
    # Ensure not duplicated
    res2 = await db.execute(select(Intercessor).where(Intercessor.user_id == body.user_id))
    if res2.scalar_one_or_none():
        raise HTTPException(409, "Already on the rota")
    i = Intercessor(**body.model_dump())
    db.add(i)
    await db.commit()
    await db.refresh(i)
    return i


@router.delete("/admin/intercessors/{iid}")
async def admin_remove(iid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(Intercessor).where(Intercessor.id == iid))
    i = res.scalar_one_or_none()
    if not i:
        return {"deleted": 0}
    await db.delete(i)
    await db.commit()
    return {"deleted": 1}


@router.get("/admin/requests")
async def admin_all_requests(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(IntercessionRequest).order_by(desc(IntercessionRequest.created_at))
    if status:
        q = q.where(IntercessionRequest.status == status)
    res = await db.execute(q.limit(500))
    return [{
        "id": r.id, "display_name": r.display_name, "text": r.text,
        "is_anonymous": r.is_anonymous, "category": r.category, "status": r.status,
        "intercessor_id": r.intercessor_id, "created_at": r.created_at,
        "assigned_at": r.assigned_at, "closed_at": r.closed_at,
        "answered_testimony": r.answered_testimony,
    } for r in res.scalars().all()]
