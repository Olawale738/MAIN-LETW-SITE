"""
Migration script to add career guidance tables to the database.
Run this script to create the career_modules, career_resources, career_sessions,
career_tasks, user_career_progress, and user_career_tasks tables.
"""

import asyncio
from sqlalchemy import text
from database import async_engine, Base
from models.career import (
    CareerModule, CareerResource, CareerSession, CareerTask,
    UserCareerProgress, UserCareerTask
)


async def create_career_tables():
    """Create all career-related tables"""
    print("Creating career guidance tables...")
    
    async with async_engine.begin() as conn:
        # Create all tables defined in the career models
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Career guidance tables created successfully!")
    print("\nCreated tables:")
    print("  - career_modules")
    print("  - career_resources")
    print("  - career_sessions")
    print("  - career_tasks")
    print("  - user_career_progress")
    print("  - user_career_tasks")


async def verify_tables():
    """Verify that the tables were created"""
    print("\nVerifying tables...")
    
    async with async_engine.connect() as conn:
        # Check if tables exist
        result = await conn.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name LIKE 'career%' OR name LIKE 'user_career%'
            ORDER BY name
        """))
        
        tables = result.fetchall()
        
        if tables:
            print("\n✅ Found career tables:")
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("\n❌ No career tables found!")


async def main():
    """Main migration function"""
    try:
        await create_career_tables()
        await verify_tables()
        print("\n🎉 Migration completed successfully!")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        await async_engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

