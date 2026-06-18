"""
Blog / Pastor's Column API.
Public reads published posts; admin manages drafts + publish.
"""

import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.blog import BlogPost
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/blog", tags=["Blog"])


def slugify(s: str) -> str:
    s = (s or "").lower().strip()
    s = re.sub(r"[^a-z0-9\-\s]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "post"


class PostIn(BaseModel):
    slug: Optional[str] = None
    title: str
    excerpt: Optional[str] = None
    body_html: str = ""
    hero_image_url: Optional[str] = None
    author_name: str = "Pastor"
    tags: Optional[str] = None
    status: str = "draft"
    is_featured: bool = False


class PostOut(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: Optional[str]
    body_html: str
    hero_image_url: Optional[str]
    author_user_id: Optional[str]
    author_name: str
    tags: Optional[str]
    status: str
    published_at: Optional[datetime]
    is_featured: bool
    created_at: datetime
    updated_at: datetime


# ─── Public ──────────────────────────────────────────────────────────────────

@router.get("/posts", response_model=List[PostOut])
async def list_public_posts(
    q: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    query = select(BlogPost).where(BlogPost.status == "published").order_by(desc(BlogPost.published_at))
    if q:
        like = f"%{q.lower()}%"
        from sqlalchemy import func
        query = query.where(or_(func.lower(BlogPost.title).like(like), func.lower(BlogPost.excerpt).like(like)))
    if tag:
        like = f"%{tag.lower()}%"
        from sqlalchemy import func
        query = query.where(func.lower(BlogPost.tags).like(like))
    query = query.limit(min(max(limit, 1), 100))
    res = await db.execute(query)
    return res.scalars().all()


@router.get("/posts/{slug}", response_model=PostOut)
async def public_post(slug: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BlogPost).where(BlogPost.slug == slug, BlogPost.status == "published"))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Post not found")
    return p


# ─── Admin ───────────────────────────────────────────────────────────────────

@router.get("/admin/posts", response_model=List[PostOut])
async def admin_list_posts(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(BlogPost).order_by(desc(BlogPost.updated_at))
    if status:
        q = q.where(BlogPost.status == status)
    res = await db.execute(q)
    return res.scalars().all()


@router.get("/admin/posts/{post_id}", response_model=PostOut)
async def admin_get_post(post_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Post not found")
    return p


@router.post("/admin/posts", response_model=PostOut, status_code=201)
async def admin_create_post(body: PostIn, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    slug = body.slug or slugify(body.title)
    # Ensure unique slug
    res = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    if res.scalar_one_or_none():
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"

    data = body.model_dump()
    data["slug"] = slug
    if data["status"] == "published":
        data["published_at"] = datetime.utcnow()
    p = BlogPost(**data, author_user_id=admin.id)
    db.add(p)
    await db.commit()
    await db.refresh(p)

    # Auto-post to social if created already-published
    if p.status == "published":
        try:
            from routers.social_posts import fire_auto_post_for_blog
            await fire_auto_post_for_blog(db, p)
            await db.commit()
        except Exception:
            pass

    return p


@router.put("/admin/posts/{post_id}", response_model=PostOut)
async def admin_update_post(post_id: str, body: PostIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Post not found")
    data = body.model_dump()
    # When transitioning draft → published, stamp published_at + fire social autopost
    just_published = (p.status != "published" and data.get("status") == "published")
    if just_published and not p.published_at:
        data["published_at"] = datetime.utcnow()
    for k, v in data.items():
        if k == "slug" and not v:
            continue
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)

    if just_published:
        try:
            from routers.social_posts import fire_auto_post_for_blog
            await fire_auto_post_for_blog(db, p)
            await db.commit()
        except Exception:
            pass

    return p


@router.delete("/admin/posts/{post_id}")
async def admin_delete_post(post_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    p = res.scalar_one_or_none()
    if not p:
        return {"deleted": 0}
    await db.delete(p)
    await db.commit()
    return {"deleted": 1}
