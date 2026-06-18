"""
Global search across sermons / blog / events / testimonies / daily verses.
Public (no auth). Simple ILIKE-based — replace with full-text index later.
"""

from typing import List, Optional, Any

from fastapi import APIRouter, Depends
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.sermon import Sermon
from models.event import Event
from models.blog import BlogPost
from models.daily_verse import DailyVerse


router = APIRouter(prefix="/api/search", tags=["Search"])


def _ilike(col, q: str):
    return func.lower(col).like(f"%{q.lower()}%")


@router.get("/")
async def global_search(q: str, limit: int = 8, db: AsyncSession = Depends(get_db)):
    q = (q or "").strip()
    if len(q) < 2:
        return {"query": q, "results": {"sermons": [], "blog": [], "events": [], "verses": []}, "total": 0}
    cap = min(max(limit, 1), 20)

    # Sermons (title / preacher / description / series)
    sres = await db.execute(
        select(Sermon)
        .where(or_(
            _ilike(Sermon.title, q),
            _ilike(Sermon.preacher, q),
            _ilike(Sermon.description, q),
            _ilike(Sermon.series, q),
        ))
        .order_by(Sermon.sermon_date.desc())
        .limit(cap)
    )
    sermons = [{
        "id": s.id, "title": s.title, "preacher": s.preacher,
        "date": s.sermon_date.isoformat() if s.sermon_date else None,
        "url": f"/sermons/{s.id}",
    } for s in sres.scalars().all()]

    # Blog
    bres = await db.execute(
        select(BlogPost)
        .where(BlogPost.status == "published")
        .where(or_(
            _ilike(BlogPost.title, q),
            _ilike(BlogPost.excerpt, q),
            _ilike(BlogPost.body_html, q),
            _ilike(BlogPost.tags, q),
        ))
        .order_by(BlogPost.published_at.desc().nulls_last() if hasattr(BlogPost.published_at, "desc") else BlogPost.published_at.desc())
        .limit(cap)
    )
    blog = [{
        "id": p.id, "title": p.title, "excerpt": p.excerpt or "",
        "date": p.published_at.isoformat() if p.published_at else None,
        "url": f"/blog/{p.slug}",
    } for p in bres.scalars().all()]

    # Events
    eres = await db.execute(
        select(Event)
        .where(or_(
            _ilike(Event.title, q) if hasattr(Event, "title") else _ilike(Event.title, q),
            _ilike(getattr(Event, "description", Event.title), q),
        ))
        .limit(cap)
    )
    events = [{
        "id": e.id, "title": getattr(e, "title", ""),
        "date": e.event_date.isoformat() if getattr(e, "event_date", None) else None,
        "url": f"/events/{e.id}",
    } for e in eres.scalars().all()]

    # Daily verses
    vres = await db.execute(
        select(DailyVerse)
        .where(DailyVerse.is_active == True)
        .where(or_(_ilike(DailyVerse.reference, q), _ilike(DailyVerse.text, q)))
        .limit(cap)
    )
    verses = [{
        "id": v.id, "reference": v.reference, "text": v.text,
        "translation": v.translation,
    } for v in vres.scalars().all()]

    total = len(sermons) + len(blog) + len(events) + len(verses)
    return {
        "query": q,
        "results": {"sermons": sermons, "blog": blog, "events": events, "verses": verses},
        "total": total,
    }
