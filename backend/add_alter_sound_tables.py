"""
Database migration script to add Alter Sound tables
Run this script to create the audio management tables in the database
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from models.base import Base
from models.alter_sound import AudioCategory, AudioTrack, AlterSoundPageSettings
from database import DATABASE_URL

async def create_tables():
    """Create all Alter Sound tables"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
    
    await engine.dispose()
    print("✅ Alter Sound tables created successfully!")

if __name__ == "__main__":
    asyncio.run(create_tables())

