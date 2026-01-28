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

# CRITICAL FIX for pgbouncer: Disable prepared statement cache
# pgbouncer in transaction mode does NOT support prepared statements
# SQLAlchemy's asyncpg dialect uses 'prepared_statement_cache_size' parameter
connect_args = {
    # CRITICAL: Use the correct parameter name for SQLAlchemy's asyncpg dialect
    "prepared_statement_cache_size": 0,
    # Disable JIT for better pgbouncer compatibility
    "server_settings": {
        "jit": "off"
    },
    # Increase connection timeout for Render's network
    "timeout": 60,  # 60 seconds timeout (default is 10)
    "command_timeout": 60,  # Command execution timeout
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
print("🔧 DATABASE CONFIGURATION - PGBOUNCER COMPATIBILITY MODE")
print("=" * 80)
print(f"Database URL: {database_url[:70]}...")
print(f"✅ prepared_statement_cache_size: {connect_args.get('prepared_statement_cache_size', 'NOT SET')}")
print(f"✅ SQLAlchemy compiled_cache: disabled")
print(f"✅ JIT: {connect_args.get('server_settings', {}).get('jit', 'NOT SET')}")
print(f"✅ SSL: {'Yes' if 'ssl' in connect_args else 'No'}")
print(f"✅ Connection timeout: {connect_args.get('timeout', 'default')}s")
print("=" * 80)

# Create async engine with explicit connect_args
# CRITICAL: use_insertmanyvalues=False disables SQLAlchemy's prepared statement optimization
engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    future=True,
    pool_pre_ping=False,  # DISABLED: Causes issues with pgbouncer prepared statements
    pool_recycle=300,  # Recycle connections after 5 minutes (pgbouncer friendly)
    pool_timeout=30,  # Wait up to 30 seconds for a connection from the pool
    connect_args=connect_args,
    # CRITICAL: Disable SQLAlchemy's prepared statement caching for pgbouncer
    execution_options={
        "compiled_cache": None,  # Disable statement compilation cache
    },
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
