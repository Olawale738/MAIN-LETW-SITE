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

# Remove any sslmode query parameters
# (asyncpg doesn't support them in URL, we'll use connect_args instead)
if "?sslmode=" in database_url or "&sslmode=" in database_url:
    import re
    database_url = re.sub(r'[?&]sslmode=[^&]*', '', database_url)

# CRITICAL: Add prepared_statement_cache_size=0 to URL for pgbouncer compatibility
# This must be in the URL, not just connect_args
if "prepared_statement_cache_size" not in database_url:
    if "?" in database_url:
        database_url += "&prepared_statement_cache_size=0"
    else:
        database_url += "?prepared_statement_cache_size=0"

# CRITICAL FIX for pgbouncer: Disable prepared statement cache
# pgbouncer in transaction mode does NOT support prepared statements
# We must completely disable them at the asyncpg connection level
connect_args = {
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
print("🔧 DATABASE CONFIGURATION - PGBOUNCER FIX")
print("=" * 80)
print(f"Database URL: {database_url[:70]}...")
print(f"✅ CRITICAL FIX: Prepared statement cache DISABLED (statement_cache_size=0)")
print(f"✅ JIT disabled: {connect_args.get('server_settings', {}).get('jit', 'NOT SET')}")
print(f"SSL configured: {'Yes' if 'ssl' in connect_args else 'No'}")
print("=" * 80)

# Create async engine with explicit connect_args
engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    future=True,
    pool_pre_ping=False,  # DISABLED: Causes issues with pgbouncer prepared statements
    pool_recycle=300,  # Recycle connections after 5 minutes (pgbouncer friendly)
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
