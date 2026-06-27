"""
Ministry Content API
- Public: GET /api/ministry-content/{key}   -> returns content dict (may be empty)
- Admin:  PUT /api/ministry-content/{key}   -> upserts content dict

key is 'women' or 'men'. The content shape is flexible (JSONB) so
admins can add new sections later without backend changes.
"""

from datetime import datetime
from typing import Any, Optional, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.ministry_content import MinistryContent
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/ministry-content", tags=["ministry-content"])

ALLOWED_KEYS = {
    "women", "men", "theology", "leadership", "giving",
    "statement-of-faith", "privacy-policy", "terms-of-service",
    "testimony-page", "hero-settings",
    # Site chrome + secondary pages — admin can now edit these too:
    "apps-list",        # Cards on /apps
    "navbar",           # Main nav links + dropdowns
    "footer",           # Footer columns + bottom row
    "tour-page",        # /tour copy + stops
    "voice-page",       # /voice copy + commands
    "grow-page",        # /grow copy + habit presets
    "email-templates",  # Welcome / reset / prayer / decision confirmations
    "onboarding-page",  # /onboarding hero, 5 chapters, scripture tagline, final CTA
    "volunteer-page",   # /volunteer hero, why-points, departments, form labels, bottom banner
}


class MinistryContentOut(BaseModel):
    key: str
    content: dict
    updated_at: Optional[datetime] = None


class MinistryContentIn(BaseModel):
    content: dict


@router.get("/{key}", response_model=MinistryContentOut)
async def get_ministry_content(key: str, db: AsyncSession = Depends(get_db)):
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=400, detail=f"key must be one of {sorted(ALLOWED_KEYS)}")
    row = (await db.execute(select(MinistryContent).where(MinistryContent.key == key))).scalar_one_or_none()
    if not row:
        return MinistryContentOut(key=key, content={}, updated_at=None)
    return MinistryContentOut(key=row.key, content=row.content or {}, updated_at=row.updated_at)


@router.put("/{key}", response_model=MinistryContentOut)
async def upsert_ministry_content(
    key: str,
    payload: MinistryContentIn,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=400, detail=f"key must be one of {sorted(ALLOWED_KEYS)}")
    row = (await db.execute(select(MinistryContent).where(MinistryContent.key == key))).scalar_one_or_none()
    if not row:
        row = MinistryContent(key=key, content=payload.content or {})
        db.add(row)
    else:
        row.content = payload.content or {}
    await db.commit()
    await db.refresh(row)
    return MinistryContentOut(key=row.key, content=row.content or {}, updated_at=row.updated_at)
