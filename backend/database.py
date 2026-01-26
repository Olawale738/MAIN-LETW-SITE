"""
Database configuration and session management.
Uses SQLAlchemy 2.0 async engine with asyncpg for PostgreSQL.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings


# Prepare database URL with SSL parameters for Supabase
# Supabase requires SSL for external connections
database_url = settings.DATABASE_URL

# Add SSL parameter if not already present (for Supabase)
if "supabase.co" in database_url and "sslmode" not in database_url:
    separator = "&" if "?" in database_url else "?"
    database_url = f"{database_url}{separator}sslmode=require"

# Create async engine
engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    future=True,
    pool_pre_ping=True,  # Verify connections before using them
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db():
    """
    Dependency that provides a database session.
    Automatically closes the session after the request.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
