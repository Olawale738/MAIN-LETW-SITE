from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import json
import uuid

from database import get_db
from models.cms import CMSPage, CMSImage
from schemas.cms import PageCreate, PageUpdate, PageResponse, ImageResponse
from utils.dependencies import get_current_user, get_admin_user
from models.user import User

router = APIRouter(
    prefix="/api/cms",
    tags=["CMS"]
)

# --- Pages ---

@router.get("/pages/{slug}", response_model=PageResponse)
async def get_page(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CMSPage).where(CMSPage.slug == slug))
    page = result.scalar_one_or_none()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return PageResponse(
        id=page.id,
        slug=page.slug,
        title=page.title,
        content=json.loads(page.content),
        updated_at=page.updated_at
    )

@router.post("/pages/{slug}", response_model=PageResponse)
async def update_page(
    slug: str, 
    page_data: PageUpdate, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(CMSPage).where(CMSPage.slug == slug))
    page = result.scalar_one_or_none()
    
    content_str = json.dumps(page_data.content)
    
    if not page:
        # Create
        page = CMSPage(
            slug=slug,
            title=page_data.title,
            content=content_str
        )
        db.add(page)
    else:
        # Update
        page.title = page_data.title
        page.content = content_str
    
    await db.commit()
    await db.refresh(page)
    
    return PageResponse(
        id=page.id,
        slug=page.slug,
        title=page.title,
        content=json.loads(page.content),
        updated_at=page.updated_at
    )

# --- Images ---

@router.post("/images", response_model=ImageResponse)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    contents = await file.read()
    mime_type = file.content_type or "application/octet-stream"
    filename = file.filename or "upload"

    # Auto-convert raster images (JPEG/PNG) to WebP for ~30-70% size reduction.
    # Skip GIFs (animation), SVGs (vector), and anything that isn't a known raster type.
    if mime_type.startswith("image/") and mime_type not in ("image/gif", "image/svg+xml", "image/webp"):
        try:
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(contents))
            # Preserve transparency where present
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="WEBP", quality=82, method=6)
            new_bytes = buf.getvalue()
            # Only switch if WebP is actually smaller (rare for some PNG icons it may not be)
            if len(new_bytes) < len(contents):
                contents = new_bytes
                mime_type = "image/webp"
                stem = filename.rsplit(".", 1)[0] if "." in filename else filename
                filename = f"{stem}.webp"
        except Exception:
            # Pillow not installed or unsupported image — keep original
            pass

    image = CMSImage(
        filename=filename,
        mime_type=mime_type,
        data=contents,
        size=len(contents)
    )

    db.add(image)
    await db.commit()
    await db.refresh(image)

    # Construct an absolute URL using the request's scheme/host so the browser
    # fetches from the backend origin instead of the frontend host.
    scheme = request.headers.get("x-forwarded-proto") or request.url.scheme
    host = request.headers.get("x-forwarded-host") or request.url.netloc
    image_url = f"{scheme}://{host}/api/cms/images/{image.id}"
    
    return ImageResponse(
        id=image.id,
        filename=image.filename,
        mime_type=image.mime_type,
        size=image.size,
        url=image_url,
        created_at=image.created_at
    )

@router.get("/images/{image_id}")
async def get_image(image_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CMSImage).where(CMSImage.id == image_id))
    image = result.scalar_one_or_none()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # asyncpg returns memoryview for BYTEA columns in PostgreSQL.
    # Must convert to bytes explicitly, otherwise the response body is corrupted.
    return Response(content=bytes(image.data), media_type=image.mime_type)

@router.delete("/images/{image_id}")
async def delete_image(
    image_id: str, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(CMSImage).where(CMSImage.id == image_id))
    image = result.scalar_one_or_none()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    await db.delete(image)
    await db.commit()
    return {"message": "Image deleted"}
