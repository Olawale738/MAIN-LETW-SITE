"""
Light Encounter Tabernacle - Backend API
Main application entry point.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# ── Sentry error tracking ────────────────────────────────────────────────────
# Set SENTRY_DSN in Render env vars to enable. No-op when unset, so safe to
# leave in for all deployments.
try:
    _sentry_dsn = os.getenv("SENTRY_DSN")
    if _sentry_dsn:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        sentry_sdk.init(
            dsn=_sentry_dsn,
            integrations=[FastApiIntegration()],
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_RATE", "0.1")),
            environment=os.getenv("APP_ENV", "production"),
        )
except Exception:
    pass

from config import settings
from database import init_db

# Import all models to register them with SQLAlchemy Base BEFORE init_db
import models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle events."""
    # Startup: Initialize database tables
    print("🚀 Starting Light Encounter Tabernacle API...")
    await init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("👋 Shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Light Encounter Tabernacle church website",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend
# Allow multiple origins for development and production
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://letw.vercel.app",  # Production frontend
    "https://letw-git-main-letw-code.vercel.app",
    "https://letw.org",  # Production domain (without www)
    "https://www.letw.org",  # Production domain (with www)
    "http://letw.org",  # HTTP fallback
    "http://www.letw.org",  # HTTP fallback with www
]

# Remove duplicates and empty strings
allowed_origins = list(set(filter(None, allowed_origins)))

print(f"🌐 CORS enabled for origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # allow all Vercel preview/deploy URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Allow frontend to read all response headers
)


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "message": "Welcome to Light Encounter Tabernacle API",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


# Import and register routers after app creation to avoid circular imports
from routers import auth, users, service_requests, notifications, announcements, leadership, sermons, events, dashboard, skills, career, prayer, alter_sound, bible_study, cms
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(service_requests.router, prefix="/api/service-requests", tags=["Service Requests"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(announcements.router, prefix="/api/announcements", tags=["Announcements"])
app.include_router(skills.router)
app.include_router(leadership.router)
app.include_router(sermons.router)
app.include_router(events.router)
app.include_router(dashboard.router)
app.include_router(career.router)
app.include_router(prayer.router)
app.include_router(alter_sound.router)
app.include_router(bible_study.router)
app.include_router(cms.router)

from routers import live_stream
app.include_router(live_stream.router)

# Admin live chat
from routers import chat
app.include_router(chat.router)

# Choir group chat
from routers import choir_chat
app.include_router(choir_chat.router)

# Department management (Choir, Youth, Children)
from routers.departments import router as departments_router, admin_router as dept_admin_router
app.include_router(departments_router)
app.include_router(dept_admin_router)

# Evangelism interest sign-up (public + admin)
from routers import evangelism
app.include_router(evangelism.router)

# Newsletter (subscribe + admin broadcast)
from routers import newsletter
app.include_router(newsletter.router)

# Custom Ministries (Women's, Men's, Marriage, etc.) - admin-created
from routers import ministries
app.include_router(ministries.router)

# Youth Programs (per-program detail page + dashboard)
from routers import youth_program
app.include_router(youth_program.router)

# Ministry content (Women's + Men's ministry editable sections)
from routers import ministry_content
app.include_router(ministry_content.router)

# Site Branding (admin-uploaded logo + favicon)
from routers import site_branding
app.include_router(site_branding.router)

# Welcome onboarding flow
from routers import welcome_flow
app.include_router(welcome_flow.router)

# Discipleship pathway
from routers import discipleship
app.include_router(discipleship.router)

# Counselling appointment booking
from routers import counselling
app.include_router(counselling.router)

# Life event requests (wedding / baptism / dedication / funeral)
from routers import life_events
app.include_router(life_events.router)

# Payments (provider registry + checkout + webhooks + donation log)
from routers import payments
app.include_router(payments.router)

# Daily Verse rotation (homepage widget)
from routers import daily_verse
app.include_router(daily_verse.router)

# Moderator management — admin assigns per-scope access
from routers import moderators as moderators_router
app.include_router(moderators_router.router)

# Governance — Lead Coordinators + Audit Log
from routers import governance
app.include_router(governance.router)

# Social media auto-poster
from routers import social_posts
app.include_router(social_posts.router)

# SEO meta per page
from routers import seo_meta
app.include_router(seo_meta.router)

# Pastor's blog
from routers import blog
app.include_router(blog.router)

# YouTube metadata import (sermons)
from routers import youtube_import
app.include_router(youtube_import.router)

# 2FA (TOTP)
from routers import two_factor
app.include_router(two_factor.router)

# Global search
from routers import search as search_router
app.include_router(search_router.router)

# Database backups → Supabase Storage (daily via external cron)
from routers import backups as backups_router
app.include_router(backups_router.router)
# Deploy nudge: ensures Render picks up youth_programs router and tables
# (youth_programs, youth_program_messages, youth_program_activities,
#  youth_program_rsvps, youth_program_attendances).

# 360-Degree Chat Extensions (reactions, replies, polls, attachments, etc.)
from routers import chat_extensions
app.include_router(chat_extensions.router)

# Comprehensive Event Features (RSVPs, speakers, sessions, gallery, etc.)
from routers import event_extensions
app.include_router(event_extensions.router)

# Chat / messaging
from routers import messages
app.include_router(messages.router)

# User profile, activity, prayer wall
try:
    from routers import profile as profile_router
    from routers import activity as activity_router
    from routers import prayer_wall as prayer_wall_router
    app.include_router(profile_router.router)
    app.include_router(activity_router.router)
    app.include_router(prayer_wall_router.router)
except Exception:
    pass

# Mount static files for uploads
# Create uploads directory if it doesn't exist
UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(f"{UPLOADS_DIR}/audio", exist_ok=True)
os.makedirs(f"{UPLOADS_DIR}/audio/covers", exist_ok=True)
os.makedirs(f"{UPLOADS_DIR}/bible-resources", exist_ok=True)
os.makedirs(f"{UPLOADS_DIR}/branding", exist_ok=True)
os.makedirs(f"{UPLOADS_DIR}/event-photos", exist_ok=True)

# Mount the uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
