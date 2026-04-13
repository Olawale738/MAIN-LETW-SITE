"""
Migration: Bible Reading Plan v2
- Adds year_label column to bible_study_page_settings (safe on existing rows)
- Creates user_bible_week_progress table
- Creates week_reflections table
- Creates quarterly_themes table

Run with:
    cd backend && python migrate_bible_reading_v2.py
"""
import asyncio
from sqlalchemy import text
from database import engine


MIGRATIONS = [
    (
        "Add year_label to bible_study_page_settings",
        "ALTER TABLE bible_study_page_settings ADD COLUMN IF NOT EXISTS year_label VARCHAR(20) DEFAULT '2026';"
    ),
    (
        "Create user_bible_week_progress",
        """
        CREATE TABLE IF NOT EXISTS user_bible_week_progress (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            week_number INTEGER NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP,
            registered BOOLEAN DEFAULT TRUE,
            CONSTRAINT unique_user_week_progress UNIQUE (user_id, week_number)
        );
        """
    ),
    (
        "Create week_reflections",
        """
        CREATE TABLE IF NOT EXISTS week_reflections (
            id VARCHAR(36) PRIMARY KEY,
            week_number INTEGER NOT NULL UNIQUE,
            key_verse TEXT NOT NULL,
            verse_ref VARCHAR(100) NOT NULL,
            reflection TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """
    ),
    (
        "Create quarterly_themes",
        """
        CREATE TABLE IF NOT EXISTS quarterly_themes (
            id VARCHAR(36) PRIMARY KEY,
            quarter_number INTEGER NOT NULL UNIQUE,
            title VARCHAR(255) NOT NULL,
            theme VARCHAR(255) NOT NULL,
            scripture VARCHAR(255) NOT NULL,
            description TEXT,
            accent_color VARCHAR(20) DEFAULT '#f5bb00',
            week_start INTEGER NOT NULL,
            week_end INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """
    ),
]


async def run_migration():
    print("🚀 Running Bible Reading v2 migration...\n")
    async with engine.begin() as conn:
        for label, sql in MIGRATIONS:
            try:
                await conn.execute(text(sql))
                print(f"  ✅ {label}")
            except Exception as e:
                print(f"  ⚠️  {label} — skipped or failed: {e}")

    await engine.dispose()
    print("\n🎉 Migration complete!")


if __name__ == "__main__":
    asyncio.run(run_migration())
