"""
Database migration script to add Bible Study tables
Run this script to create the Bible reading plan tables in the database
"""
import asyncio
from database import Base, engine
from models.bible_study import (
    BibleReadingPlan,
    DailyReading,
    UserReadingProgress,
    UserDailyReading,
    BibleStudyResource,
    BibleStudyPageSettings
)

async def create_tables():
    """Create all Bible Study tables"""
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)

    await engine.dispose()
    print("✅ Bible Study tables created successfully!")

if __name__ == "__main__":
    asyncio.run(create_tables())

