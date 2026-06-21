"""
Database configuration and session management.
Uses SQLAlchemy 2.0 async engine with asyncpg for PostgreSQL.
"""

import uuid
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
    # asyncpg connect_args for PgBouncer transaction pooling mode.
    #
    # CRITICAL: statement_cache_size=0 alone is NOT enough. PgBouncer in
    # transaction mode pools physical connections across requests, and
    # asyncpg's default prepared-statement names (__asyncpg_stmt_cN__) are
    # deterministic per connection. When the same pooled connection is
    # reused for two different statements, the names collide:
    #     DuplicatePreparedStatementError: __asyncpg_stmt_c5__ already exists
    #
    # The fix is to make EACH prepared statement get a unique name via
    # prepared_statement_name_func. UUIDs guarantee no collision.
    async_connect_args = {
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4().hex}__",
        "server_settings": {
            "jit": "off",
        },
    }
    print(f"[database.py] Supabase detected - disabling prepared statement cache + randomising names", flush=True)
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
    """Create all database tables and patch any missing columns on existing tables."""
    print("[init_db] Initializing database tables...", flush=True)
    print(f"[init_db] Tables registered in metadata: {sorted(Base.metadata.tables.keys())}", flush=True)
    try:
        async with engine.connect() as conn:
            from sqlalchemy import text

            result = await conn.execute(text("SELECT current_database(), current_schema()"))
            row = result.fetchone()
            print(f"[init_db] Connected to database='{row[0]}' schema='{row[1]}'", flush=True)

            # Create any tables that don't exist yet
            await conn.run_sync(Base.metadata.create_all)
            await conn.commit()

            # ── Patch missing columns on the manually-created `users` table ──
            # These columns were added to the model after the table was created by hand.
            missing_columns: list[tuple[str, str, str]] = [
                ("users",   "services",     "JSONB NOT NULL DEFAULT '[]'::jsonb"),
                ("users",   "avatar_url",   "VARCHAR(500)"),
                ("users",   "bio",          "TEXT"),
                ("users",   "phone",        "VARCHAR(40)"),
                ("users",   "location",     "VARCHAR(255)"),
                ("users",   "updated_at",   "TIMESTAMPTZ NOT NULL DEFAULT NOW()"),
                # Sermon: external document URL (PDF link)
                ("sermons", "document_url", "VARCHAR(500)"),
                # Bible study page settings: admin-managed JSON content
                ("bible_study_page_settings", "weekly_topics", "JSONB DEFAULT '[]'::jsonb"),
                ("bible_study_page_settings", "study_groups",  "JSONB DEFAULT '[]'::jsonb"),
                ("bible_study_page_settings", "session_notes", "JSONB DEFAULT '[]'::jsonb"),
                ("bible_study_page_settings", "year_label",    "VARCHAR(20) DEFAULT '2026'"),
                ("bible_study_page_settings", "library_resources", "JSONB DEFAULT '[]'::jsonb"),
                ("bible_study_page_settings", "study_tools",       "JSONB DEFAULT '[]'::jsonb"),
                ("bible_study_page_settings", "podcasts",          "JSONB DEFAULT '[]'::jsonb"),
                ("bible_study_page_settings", "resources_heading",  "VARCHAR(255)"),
                ("bible_study_page_settings", "resources_subtitle", "TEXT"),
                ("bible_study_page_settings", "mentors",            "JSONB DEFAULT '[]'::jsonb"),
                ("bible_study_page_settings", "impact_stats",       "JSONB DEFAULT '[]'::jsonb"),
                ("youth_programs", "coordinator_user_ids", "JSONB DEFAULT '[]'::jsonb"),
                ("department_members", "is_coordinator", "BOOLEAN NOT NULL DEFAULT FALSE"),
                # Prayer page settings: added section headings + CTAs
                ("prayer_page_settings", "hero_eyebrow",         "VARCHAR(120)"),
                ("prayer_page_settings", "primary_cta_text",     "VARCHAR(120)"),
                ("prayer_page_settings", "primary_cta_link",     "VARCHAR(500)"),
                ("prayer_page_settings", "secondary_cta_text",   "VARCHAR(120)"),
                ("prayer_page_settings", "secondary_cta_link",   "VARCHAR(500)"),
                ("prayer_page_settings", "stats_eyebrow",        "VARCHAR(120)"),
                ("prayer_page_settings", "stats_heading",        "VARCHAR(255)"),
                ("prayer_page_settings", "stats_subtitle",       "TEXT"),
                ("prayer_page_settings", "categories_eyebrow",   "VARCHAR(120)"),
                ("prayer_page_settings", "categories_heading",   "VARCHAR(255)"),
                ("prayer_page_settings", "categories_subtitle",  "TEXT"),
                ("prayer_page_settings", "schedules_eyebrow",    "VARCHAR(120)"),
                ("prayer_page_settings", "schedules_heading",    "VARCHAR(255)"),
                ("prayer_page_settings", "schedules_subtitle",   "TEXT"),
                ("prayer_page_settings", "final_eyebrow",        "VARCHAR(120)"),
                ("prayer_page_settings", "final_heading",        "VARCHAR(255)"),
                # Prayer page settings: revamp 2 (manifesto / how / answered / wall)
                ("prayer_page_settings", "manifesto_eyebrow",    "VARCHAR(120)"),
                ("prayer_page_settings", "manifesto_heading",    "VARCHAR(255)"),
                ("prayer_page_settings", "manifesto_subtitle",   "TEXT"),
                ("prayer_page_settings", "manifesto_pillars",    "JSONB DEFAULT '[]'::jsonb"),
                ("prayer_page_settings", "how_eyebrow",          "VARCHAR(120)"),
                ("prayer_page_settings", "how_heading",          "VARCHAR(255)"),
                ("prayer_page_settings", "how_subtitle",         "TEXT"),
                ("prayer_page_settings", "how_steps",            "JSONB DEFAULT '[]'::jsonb"),
                ("prayer_page_settings", "answered_eyebrow",     "VARCHAR(120)"),
                ("prayer_page_settings", "answered_heading",     "VARCHAR(255)"),
                ("prayer_page_settings", "answered_subtitle",    "TEXT"),
                ("prayer_page_settings", "answered_max_items",   "INTEGER DEFAULT 6"),
                ("prayer_page_settings", "wall_eyebrow",         "VARCHAR(120)"),
                ("prayer_page_settings", "wall_heading",         "VARCHAR(255)"),
                ("prayer_page_settings", "wall_subtitle",        "TEXT"),
                ("prayer_page_settings", "wall_link",            "VARCHAR(500)"),
                ("prayer_page_settings", "wall_link_text",       "VARCHAR(120)"),
                ("prayer_page_settings", "wall_max_items",       "INTEGER DEFAULT 4"),
                # Decisions → testimony bridge
                ("decisions", "show_in_testimony", "BOOLEAN DEFAULT FALSE"),
                # Online services: cover image, social links, sermon/event linkage
                ("online_services", "cover_image_url", "VARCHAR(500)"),
                ("online_services", "youtube_url",     "VARCHAR(500)"),
                ("online_services", "facebook_url",    "VARCHAR(500)"),
                ("online_services", "instagram_url",   "VARCHAR(500)"),
                ("online_services", "twitter_url",     "VARCHAR(500)"),
                ("online_services", "tiktok_url",      "VARCHAR(500)"),
                ("online_services", "sermon_id",       "VARCHAR(36)"),
                ("online_services", "event_id",        "VARCHAR(36)"),
                # Site settings: where to show the floating live banner
                ("site_settings", "live_banner_mode",  "VARCHAR(20) DEFAULT 'floating'"),
                # Users — country segmentation captured at signup
                ("users", "country_code", "VARCHAR(2)"),
                ("users", "country_name", "VARCHAR(120)"),
                ("users", "continent", "VARCHAR(40)"),
            ]

            # NOTE: use literal SQL (not bind params) so asyncpg doesn't create
            # prepared statements. PgBouncer in transaction-pool mode reuses
            # connections across transactions, and asyncpg's prepared statement
            # names collide across them, causing DuplicatePreparedStatementError.
            # Inputs come from the trusted missing_columns list above, so there
            # is no SQL injection surface here.
            #
            # Each iteration is wrapped in its own try/except so a single failure
            # never crashes startup. Worst case: a column doesn't get added on
            # this restart, but the app still boots and serves requests.
            for table, column, col_def in missing_columns:
                try:
                    t_lit = table.replace("'", "''")
                    c_lit = column.replace("'", "''")
                    check = await conn.execute(text(
                        "SELECT 1 FROM information_schema.columns "
                        "WHERE table_schema = 'public' "
                        f"AND table_name = '{t_lit}' AND column_name = '{c_lit}'"
                    ))
                    if check.fetchone() is None:
                        print(f"[init_db] Adding missing column {table}.{column}", flush=True)
                        await conn.execute(text(
                            f'ALTER TABLE public."{table}" ADD COLUMN IF NOT EXISTS {column} {col_def}'
                        ))
                        await conn.commit()
                except Exception as col_err:
                    # Log and continue — never let migration crash startup
                    print(f"[init_db] WARN: column-check skipped for {table}.{column}: {type(col_err).__name__}", flush=True)

        print("[init_db] Database tables initialised successfully", flush=True)
    except Exception as e:
        # NEVER let a startup-time migration error crash the entire app.
        # An app that runs with stale column definitions is far better than
        # an app that's completely down. Optional columns can be patched
        # on a later restart once the underlying pgbouncer/asyncpg issue
        # cleans up its connection state.
        print(f"[init_db] WARN: startup migration failed but app will continue: {type(e).__name__}: {e}", flush=True)
