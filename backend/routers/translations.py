"""
Multi-language UI translations.

Strategy: store the full dictionary for a given locale under a single
ministry-content row keyed 'translations:<locale>'. The frontend loads the
locale on startup and falls back to English keys for anything missing. Admin
edits any phrase per locale via /admin/translations.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.ministry_content import MinistryContent
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/translations", tags=["Translations"])

# Locales the frontend offers in its picker. Adding a new one is just adding
# it here + saving translations via the admin page.
SUPPORTED_LOCALES = [
    "en", "es", "pt", "fr", "de", "it", "ar", "zh", "ja", "ko", "hi",
    "yo", "ig", "ha", "sw", "ru",
]


def _row_key(locale: str) -> str:
    return f"translations:{locale}"


@router.get("/locales")
async def list_locales():
    return {"locales": SUPPORTED_LOCALES}


@router.get("/{locale}")
async def get_dictionary(locale: str, db: AsyncSession = Depends(get_db)):
    """Public read of the translation dictionary for a locale."""
    if locale not in SUPPORTED_LOCALES:
        raise HTTPException(400, f"Unsupported locale '{locale}'")
    row = (await db.execute(select(MinistryContent).where(MinistryContent.key == _row_key(locale)))).scalar_one_or_none()
    return {"locale": locale, "translations": (row.content if row and row.content else {})}


class DictUpdate(BaseModel):
    translations: dict


@router.put("/{locale}")
async def upsert_dictionary(
    locale: str,
    body: DictUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    if locale not in SUPPORTED_LOCALES:
        raise HTTPException(400, f"Unsupported locale '{locale}'")
    key = _row_key(locale)
    row = (await db.execute(select(MinistryContent).where(MinistryContent.key == key))).scalar_one_or_none()
    if not row:
        row = MinistryContent(key=key, content=body.translations or {})
        db.add(row)
    else:
        row.content = body.translations or {}
    await db.commit()
    await db.refresh(row)
    return {"locale": locale, "translations": row.content or {}}
