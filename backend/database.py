"""
Database configuration and session management.
Uses SQLAlchemy 2.0 async engine with asyncpg for PostgreSQL.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from config import settings


print(f"[database.py] Using DB URL scheme: {settings.DATABASE_URL.split('://')[0]}", flush=True)

# Determine if using Supabase (needs special PgBouncer settings)
is_supabase = "supabase.com" in settings.DATABASE_URL or "pooler.supabase.com" in settings.DATABASE_URL

# For Supabase with asyncpg: disable prepared statement caching for PgBouncer compatibility
# For other PostgreSQL: use default settings
if is_supabase:
    # asyncpg connect_args for PgBouncer transaction pooling mode
    # CRITICAL: Both parameters are needed for full compatibility
    async_connect_args = {
        "prepared_statement_cache_size": 0,  # SQLAlchemy dialect parameter
        "statement_cache_size": 0,            # asyncpg native parameter
        "server_settings": {
            "jit": "off"  # Disable JIT for better pgbouncer compatibility
        },
    }
    print(f"[database.py] Supabase detected - disabling prepared statement cache", flush=True)
else:
    async_connect_args = {}

# Async engine for FastAPI
# NullPool ensures we don't do any pooling on SQLAlchemy side (let PgBouncer handle it)
# This is CRITICAL for pgbouncer compatibility
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    future=True,
    poolclass=NullPool,  # CRITICAL: Let pgbouncer handle pooling
    connect_args=async_connect_args,
)

print(f"[database.py] Async engine created with NullPool", flush=True)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


# Dependency to get async database session
async def get_db():
    """
    Dependency that provides a database session.
    Automatically closes the session after the request.
    """
    print("[get_db] Creating async session...", flush=True)
    try:
        async with AsyncSessionLocal() as session:
            print("[get_db] Session created successfully", flush=True)
            try:
                yield session
            finally:
                await session.close()
    except Exception as e:
        print(f"[get_db] ERROR creating session: {type(e).__name__}: {e}", flush=True)
        raise


async def init_db():
    """Create all database tables."""
    print("[init_db] Initializing database tables...", flush=True)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[init_db] Database tables created successfully", flush=True)
    except Exception as e:
        print(f"[init_db] ERROR: {type(e).__name__}: {e}", flush=True)
        raise
