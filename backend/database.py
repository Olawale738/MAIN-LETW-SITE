"""
Database configuration and session management.
Uses SQLAlchemy 2.0 async engine with asyncpg for PostgreSQL.
"""

import ssl as ssl_module
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings


# Prepare database URL and SSL configuration for Supabase
# Supabase requires SSL for external connections
database_url = settings.DATABASE_URL

# Remove any sslmode query parameters (asyncpg doesn't support them)
if "?sslmode=" in database_url or "&sslmode=" in database_url:
    # Remove sslmode parameter if present
    import re
    database_url = re.sub(r'[?&]sslmode=[^&]*', '', database_url)

# Configure connection arguments for asyncpg
connect_args = {
    # CRITICAL FIX: Disable prepared statement cache for pgbouncer compatibility
    # pgbouncer in transaction mode doesn't support prepared statements
    # This MUST be set to 0 to avoid DuplicatePreparedStatementError
    "statement_cache_size": 0,

    # Disable JIT for better pgbouncer compatibility
    "server_settings": {
        "jit": "off"
    }
}

# Add SSL context for Supabase direct connections (not pooler)
if "supabase.co" in database_url and "pooler.supabase.com" not in database_url:
    # Direct connection to Supabase requires SSL
    # Pooler connections don't need SSL configuration (handled by pooler)
    ssl_context = ssl_module.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl_module.CERT_NONE
    connect_args["ssl"] = ssl_context

# Log the critical fix being applied
print("=" * 80)
print("🔧 DATABASE CONFIGURATION")
print("=" * 80)
print(f"Database URL: {database_url[:50]}...")
print(f"✅ CRITICAL FIX APPLIED: statement_cache_size = {connect_args.get('statement_cache_size', 'NOT SET')}")
print(f"✅ JIT disabled: {connect_args.get('server_settings', {}).get('jit', 'NOT SET')}")
print(f"SSL configured: {'Yes' if 'ssl' in connect_args else 'No'}")
print("=" * 80)

# Create async engine with explicit connect_args
engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    future=True,
    pool_pre_ping=True,  # Verify connections before using them
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args=connect_args,
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
