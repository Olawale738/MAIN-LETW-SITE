"""
Evangelism API
- Public (no auth): POST /api/evangelism/interest — visitor sign-up
- Admin only:       GET  /api/evangelism/interests  — list all sign-ups
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.evangelism import EvangelismInterest
from models.user import User
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/evangelism", tags=["Evangelism"])


# ─── Schemas ─────────────────────────────────────────────────────────────────

class InterestIn(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    availability: Optional[str] = None
    message: Optional[str] = None


class InterestOut(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    availability: Optional[str]
    message: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


# ─── Public endpoint ──────────────────────────────────────────────────────────

@router.post("/interest", status_code=201)
async def register_interest(
    body: InterestIn,
    db: AsyncSession = Depends(get_db),
):
    """
    Public sign-up — no authentication required.
    Visitor expresses interest in joining outreach activities.
    """
    if not body.name.strip() or not body.email.strip():
        raise HTTPException(status_code=400, detail="Name and email are required.")

    record = EvangelismInterest(
        name=body.name.strip(),
        email=body.email.strip().lower(),
        phone=body.phone.strip() if body.phone else None,
        availability=body.availability,
        message=body.message.strip() if body.message else None,
    )
    db.add(record)
    await db.commit()
    return {"message": "Thank you! We'll reach out to you soon. God bless you."}


# ─── Admin endpoint ───────────────────────────────────────────────────────────

@router.get("/interests", response_model=List[InterestOut])
async def list_interests(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Admin: view all evangelism interest sign-ups."""
    result = await db.execute(
        select(EvangelismInterest).order_by(EvangelismInterest.created_at.desc())
    )
    rows = result.scalars().all()
    return [
        InterestOut(
            id=r.id,
            name=r.name,
            email=r.email,
            phone=r.phone,
            availability=r.availability,
            message=r.message,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]


@router.delete("/interests/{interest_id}")
async def delete_interest(
    interest_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Admin: remove an interest record."""
    result = await db.execute(
        select(EvangelismInterest).where(EvangelismInterest.id == interest_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")
    await db.delete(record)
    await db.commit()
    return {"message": "Deleted."}
