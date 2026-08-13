"""
Evangelism API
- Public (no auth): POST /api/evangelism/interest — visitor sign-up
- Admin only:       GET  /api/evangelism/interests  — list all sign-ups
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database import get_db
from models.evangelism import EvangelismInterest
from models.leaflet import EvangelismLeaflet
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


# ─── Evangelism leaflets (admin-authored, ministry-branded, printable) ─────────

class LeafletIn(BaseModel):
    title: str = "Untitled leaflet"
    headline: str = "God Loves You"
    subheadline: Optional[str] = None
    body_html: str = ""
    scripture_ref: Optional[str] = None
    scripture_text: Optional[str] = None
    cta_text: Optional[str] = None
    cta_detail: Optional[str] = None
    accent_color: str = "#f5bb00"
    design: str = "classic"
    logo_url: Optional[str] = None
    image_url: Optional[str] = None
    qr_url: Optional[str] = None
    qr_caption: Optional[str] = None
    layout: str = "flyer"
    church_name: str = "Light Encounter Tabernacle Worldwide"
    contact_phone: Optional[str] = None
    contact_website: Optional[str] = "letw.org"
    contact_address: Optional[str] = None
    service_times: Optional[str] = None
    footer_note: Optional[str] = None
    status: str = "draft"
    is_public: bool = False


class LeafletOut(LeafletIn):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/leaflets/{leaflet_id}", response_model=LeafletOut)
async def public_leaflet(leaflet_id: str, db: AsyncSession = Depends(get_db)):
    """Public read — only leaflets the admin has published + marked shareable."""
    res = await db.execute(select(EvangelismLeaflet).where(EvangelismLeaflet.id == leaflet_id))
    lf = res.scalar_one_or_none()
    if not lf or lf.status != "published" or not lf.is_public:
        raise HTTPException(404, "Leaflet not found.")
    return lf


@router.get("/admin/leaflets", response_model=List[LeafletOut])
async def admin_list_leaflets(
    db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)
):
    res = await db.execute(select(EvangelismLeaflet).order_by(desc(EvangelismLeaflet.updated_at)))
    return res.scalars().all()


@router.get("/admin/leaflets/{leaflet_id}", response_model=LeafletOut)
async def admin_get_leaflet(
    leaflet_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)
):
    res = await db.execute(select(EvangelismLeaflet).where(EvangelismLeaflet.id == leaflet_id))
    lf = res.scalar_one_or_none()
    if not lf:
        raise HTTPException(404, "Leaflet not found.")
    return lf


@router.post("/admin/leaflets", response_model=LeafletOut, status_code=201)
async def admin_create_leaflet(
    body: LeafletIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)
):
    lf = EvangelismLeaflet(**body.model_dump())
    db.add(lf)
    await db.commit()
    await db.refresh(lf)
    return lf


@router.put("/admin/leaflets/{leaflet_id}", response_model=LeafletOut)
async def admin_update_leaflet(
    leaflet_id: str, body: LeafletIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)
):
    res = await db.execute(select(EvangelismLeaflet).where(EvangelismLeaflet.id == leaflet_id))
    lf = res.scalar_one_or_none()
    if not lf:
        raise HTTPException(404, "Leaflet not found.")
    for k, v in body.model_dump().items():
        setattr(lf, k, v)
    await db.commit()
    await db.refresh(lf)
    return lf


@router.delete("/admin/leaflets/{leaflet_id}")
async def admin_delete_leaflet(
    leaflet_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)
):
    res = await db.execute(select(EvangelismLeaflet).where(EvangelismLeaflet.id == leaflet_id))
    lf = res.scalar_one_or_none()
    if not lf:
        return {"deleted": 0}
    await db.delete(lf)
    await db.commit()
    return {"deleted": 1}
