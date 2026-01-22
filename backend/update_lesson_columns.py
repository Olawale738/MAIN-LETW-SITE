import asyncio
from sqlalchemy import text
from database import engine

async def update_schema():
    print("Updating schema...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_urls JSON DEFAULT '[]'"))
            print("Added video_urls column")
        except Exception as e:
            print(f"Error adding video_urls: {e}")

        try:
            await conn.execute(text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS images JSON DEFAULT '[]'"))
            print("Added images column")
        except Exception as e:
            print(f"Error adding images: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE lessons ALTER COLUMN content_type SET DEFAULT 'mixed'"))
            print("Updated content_type default")
        except Exception as e:
            print(f"Error updating content_type: {e}")

if __name__ == "__main__":
    asyncio.run(update_schema())
