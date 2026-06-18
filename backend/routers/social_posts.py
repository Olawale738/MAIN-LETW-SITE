"""
Social Media Auto-Poster API.

- Admin configures access tokens per platform at /api/social/targets
- Auto-post on new sermon: when a sermon is created, every active target with
  auto_post_sermons=true is fired.
- Manual post: admin can compose a one-off message via /api/social/post-manual
- Re-post any historical sermon via /api/social/post-sermon/{sermon_id}
"""

from datetime import datetime
from typing import List, Optional, Any
import asyncio

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.social_post import SocialPostTarget, SocialPost
from models.sermon import Sermon
from utils.dependencies import get_admin_user
from utils.social_poster import post_to_twitter, post_to_facebook, post_to_instagram


router = APIRouter(prefix="/api/social", tags=["Social Auto-Poster"])

PLATFORMS = {"twitter", "facebook", "instagram"}


# ─── Target (credentials) CRUD ───────────────────────────────────────────────

class TargetIn(BaseModel):
    platform: str
    display_name: str = ""
    access_token: Optional[str] = None
    page_id: Optional[str] = None
    account_id: Optional[str] = None
    is_active: bool = False
    auto_post_sermons: bool = False
    config: Optional[Any] = None


class TargetOut(BaseModel):
    id: str
    platform: str
    display_name: str
    access_token_masked: Optional[str]
    page_id: Optional[str]
    account_id: Optional[str]
    is_active: bool
    auto_post_sermons: bool
    config: Optional[Any]
    updated_at: datetime


def _mask(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    if len(value) <= 8:
        return "•" * len(value)
    return value[:4] + "•" * (len(value) - 8) + value[-4:]


def _to_out(t: SocialPostTarget) -> TargetOut:
    return TargetOut(
        id=t.id, platform=t.platform, display_name=t.display_name,
        access_token_masked=_mask(t.access_token),
        page_id=t.page_id, account_id=t.account_id,
        is_active=t.is_active, auto_post_sermons=t.auto_post_sermons,
        config=t.config, updated_at=t.updated_at,
    )


@router.get("/targets", response_model=List[TargetOut])
async def list_targets(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(SocialPostTarget).order_by(SocialPostTarget.platform))
    return [_to_out(t) for t in res.scalars().all()]


@router.put("/targets/{platform}", response_model=TargetOut)
async def upsert_target(
    platform: str, body: TargetIn,
    db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user),
):
    if platform not in PLATFORMS:
        raise HTTPException(400, f"platform must be one of {sorted(PLATFORMS)}")
    res = await db.execute(select(SocialPostTarget).where(SocialPostTarget.platform == platform))
    t = res.scalar_one_or_none()
    data = body.model_dump()
    data["platform"] = platform
    # Preserve existing token if masked value is passed back
    if data.get("access_token") and "•" in (data["access_token"] or "") and t:
        data["access_token"] = t.access_token
    if not t:
        t = SocialPostTarget(**data)
        db.add(t)
    else:
        for k, v in data.items():
            setattr(t, k, v)
    await db.commit()
    await db.refresh(t)
    return _to_out(t)


@router.delete("/targets/{platform}")
async def delete_target(platform: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(SocialPostTarget).where(SocialPostTarget.platform == platform))
    t = res.scalar_one_or_none()
    if not t:
        return {"deleted": 0}
    await db.delete(t)
    await db.commit()
    return {"deleted": 1}


# ─── Posting ─────────────────────────────────────────────────────────────────

class ManualPostIn(BaseModel):
    message: str
    platforms: List[str]
    media_url: Optional[str] = None


def _build_sermon_message(s: Sermon) -> str:
    parts = [f"New sermon: \"{s.title}\""]
    if s.preacher:
        parts.append(f"by {s.preacher}")
    if s.series:
        parts.append(f"(Series: {s.series})")
    parts.append("Listen at letw.org/sermons")
    return " ".join(parts)


async def _post_once(db: AsyncSession, platform: str, message: str, link: Optional[str], source_kind: str, source_id: Optional[str]) -> SocialPost:
    res = await db.execute(select(SocialPostTarget).where(SocialPostTarget.platform == platform, SocialPostTarget.is_active == True))
    target = res.scalar_one_or_none()
    if not target:
        post = SocialPost(platform=platform, source_kind=source_kind, source_id=source_id, message=message,
                          status="failed", error="No active target configured")
        db.add(post); return post

    if platform == "twitter":
        url, err = await post_to_twitter(target.access_token or "", message)
    elif platform == "facebook":
        url, err = await post_to_facebook(target.page_id or "", target.access_token or "", message, link)
    elif platform == "instagram":
        url, err = await post_to_instagram()
    else:
        url, err = None, f"Unknown platform: {platform}"

    post = SocialPost(
        platform=platform, source_kind=source_kind, source_id=source_id, message=message,
        status="posted" if not err else "failed",
        external_url=url, error=err,
        posted_at=datetime.utcnow() if not err else None,
    )
    db.add(post)
    return post


@router.post("/post-manual")
async def post_manual(body: ManualPostIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    results: list[dict] = []
    for p in body.platforms:
        if p not in PLATFORMS:
            results.append({"platform": p, "status": "failed", "error": "unknown platform"})
            continue
        post = await _post_once(db, p, body.message, None, "manual", None)
        results.append({"platform": p, "status": post.status, "external_url": post.external_url, "error": post.error})
    await db.commit()
    return {"results": results}


@router.post("/post-sermon/{sermon_id}")
async def post_sermon(sermon_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(Sermon).where(Sermon.id == sermon_id))
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Sermon not found")
    message = _build_sermon_message(s)
    link = s.video_url or "https://letw.org/sermons"

    # Pick every active target with auto_post_sermons (admin uses this to "fire" manually too)
    res2 = await db.execute(select(SocialPostTarget).where(SocialPostTarget.is_active == True))
    targets = list(res2.scalars().all())
    results: list[dict] = []
    for t in targets:
        post = await _post_once(db, t.platform, message, link, "sermon", sermon_id)
        results.append({"platform": t.platform, "status": post.status, "external_url": post.external_url, "error": post.error})
    await db.commit()
    return {"sermon_id": sermon_id, "results": results}


async def fire_auto_post_for_sermon(db: AsyncSession, sermon: Sermon) -> None:
    """Hook called from the sermons router when a new sermon is created. Fires
    every active target whose auto_post_sermons flag is on. Best-effort: failures
    are logged to social_posts but don't break the caller."""
    message = _build_sermon_message(sermon)
    link = sermon.video_url or "https://letw.org/sermons"
    res = await db.execute(select(SocialPostTarget).where(SocialPostTarget.is_active == True, SocialPostTarget.auto_post_sermons == True))
    for t in res.scalars().all():
        try:
            await _post_once(db, t.platform, message, link, "sermon", sermon.id)
        except Exception as e:
            db.add(SocialPost(platform=t.platform, source_kind="sermon", source_id=sermon.id,
                              message=message, status="failed", error=str(e)[:500]))


async def fire_auto_post_for_blog(db: AsyncSession, post) -> None:
    """Hook called from the blog router when a post transitions to published.
    Fires every ACTIVE target (re-uses the auto_post_sermons toggle so admins
    don't need a second flag). Best-effort: failures logged, never raise."""
    title = (post.title or "").strip()
    excerpt = (post.excerpt or "").strip()
    base = f"New on the blog: {title}"
    if excerpt:
        base = f"{base} — {excerpt}"
    link = f"https://letw.org/blog/{post.slug}"
    message = f"{base} {link}"

    res = await db.execute(select(SocialPostTarget).where(SocialPostTarget.is_active == True, SocialPostTarget.auto_post_sermons == True))
    for t in res.scalars().all():
        try:
            await _post_once(db, t.platform, message, link, "blog", post.id)
        except Exception as e:
            db.add(SocialPost(platform=t.platform, source_kind="blog", source_id=post.id,
                              message=message, status="failed", error=str(e)[:500]))


# ─── Post log ────────────────────────────────────────────────────────────────

@router.get("/posts")
async def list_posts(
    platform: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(SocialPost).order_by(desc(SocialPost.created_at))
    if platform:
        q = q.where(SocialPost.platform == platform)
    if status:
        q = q.where(SocialPost.status == status)
    q = q.limit(min(max(limit, 1), 500))
    res = await db.execute(q)
    rows = res.scalars().all()
    return [{
        "id": p.id, "platform": p.platform, "source_kind": p.source_kind, "source_id": p.source_id,
        "message": p.message, "status": p.status, "external_url": p.external_url,
        "error": p.error, "posted_at": p.posted_at, "created_at": p.created_at,
    } for p in rows]
