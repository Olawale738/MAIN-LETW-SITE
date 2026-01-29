from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status
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
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    contents = await file.read()
    
    image = CMSImage(
        filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        data=contents,
        size=len(contents)
    )
    
    db.add(image)
    await db.commit()
    await db.refresh(image)
    
    # Construct a URL for the frontend to use
    image_url = f"/api/cms/images/{image.id}"
    
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
    
    return Response(content=image.data, media_type=image.mime_type)

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
