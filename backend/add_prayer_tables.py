"""
Migration script to add prayer management tables to the database.
Run this script to create the prayer_categories, prayer_schedules, prayer_stats,
prayer_requests, user_prayers, and prayer_page_settings tables.
"""

import asyncio
from sqlalchemy import text
from database import async_engine, Base
from models.prayer import (
    PrayerCategory, PrayerSchedule, PrayerStat, PrayerRequest,
    UserPrayer, PrayerPageSettings
)


async def create_prayer_tables():
    """Create all prayer-related tables"""
    print("Creating prayer management tables...")
    
    async with async_engine.begin() as conn:
        # Create all tables defined in the prayer models
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Prayer management tables created successfully!")
    print("\nCreated tables:")
    print("  - prayer_categories")
    print("  - prayer_schedules")
    print("  - prayer_stats")
    print("  - prayer_requests")
    print("  - user_prayers")
    print("  - prayer_page_settings")


async def verify_tables():
    """Verify that the tables were created"""
    print("\nVerifying tables...")
    
    async with async_engine.connect() as conn:
        # Check if tables exist
        result = await conn.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND (name LIKE 'prayer%' OR name LIKE 'user_prayer%')
            ORDER BY name
        """))
        
        tables = result.fetchall()
        
        if tables:
            print("\n✅ Found prayer tables:")
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("\n❌ No prayer tables found!")


async def main():
    """Main migration function"""
    try:
        await create_prayer_tables()
        await verify_tables()
        print("\n🎉 Migration completed successfully!")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        await async_engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

