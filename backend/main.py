"""
Light Encounter Tabernacle - Backend API
Main application entry point.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

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

# Mount the uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
