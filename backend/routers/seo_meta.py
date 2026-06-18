"""
SEO Meta — per-page title / description / OG card.

Pages look this up by their slug (e.g. 'home', 'about', 'give', 'blog').
Frontend can call /api/seo-meta/{slug} at runtime to enrich <head>.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.seo_meta import SeoMeta
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/seo-meta", tags=["SEO Meta"])


class MetaIn(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image_url: Optional[str] = None
    canonical_url: Optional[str] = None
    robots: Optional[str] = None
    keywords: Optional[str] = None


class MetaOut(MetaIn):
    slug: str
    updated_at: datetime


@router.get("/", response_model=List[MetaOut])
async def list_all(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(SeoMeta).order_by(SeoMeta.slug))
    return res.scalars().all()


@router.get("/{slug}", response_model=Optional[MetaOut])
async def get_one(slug: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SeoMeta).where(SeoMeta.slug == slug))
    return res.scalar_one_or_none()


@router.put("/{slug}", response_model=MetaOut)
async def upsert(slug: str, body: MetaIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(SeoMeta).where(SeoMeta.slug == slug))
    m = res.scalar_one_or_none()
    data = body.model_dump()
    if not m:
        m = SeoMeta(slug=slug, **data)
        db.add(m)
    else:
        for k, v in data.items():
            setattr(m, k, v)
    await db.commit()
    await db.refresh(m)
    return m


@router.delete("/{slug}")
async def delete_meta(slug: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(SeoMeta).where(SeoMeta.slug == slug))
    m = res.scalar_one_or_none()
    if not m:
        return {"deleted": 0}
    await db.delete(m)
    await db.commit()
    return {"deleted": 1}
