"""
Migration script: Add document_url column to sermons table.
Allows storing an external URL for PDF documents as an alternative to uploading.
"""

import asyncio
from sqlalchemy import text
from database import engine


async def migrate():
    async with engine.begin() as conn:
        # Check if column already exists
        result = await conn.execute(
            text("SELECT column_name FROM information_schema.columns WHERE table_name='sermons' AND column_name='document_url'")
        )
        if result.fetchone():
            print("Column 'document_url' already exists in 'sermons' table. Skipping.")
            return

        await conn.execute(
            text("ALTER TABLE sermons ADD COLUMN document_url VARCHAR(500)")
        )
        print("✅ Successfully added 'document_url' column to 'sermons' table.")


async def main():
    try:
        await migrate()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
