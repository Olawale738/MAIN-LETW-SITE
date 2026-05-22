"""
One-off migration that:
  - Adds avatar_url, bio, phone, location columns to `users`
  - Creates the conversations and messages tables

Works against the project's current async engine (Postgres / Supabase).
Run with:    python add_chat_and_profile_tables.py
"""

import asyncio

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncEngine

from database import engine, Base
# Importing models registers them on Base.metadata
import models  # noqa: F401
from models.message import Conversation, Message


ALTER_STATEMENTS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(40)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255)",
]


async def main():
    print("Running chat + profile migration...")
    async with engine.begin() as conn:
        # 1) Add new user columns (Postgres). If running on SQLite, ALTER ADD
        # COLUMN IF NOT EXISTS is unsupported - we wrap in try/except.
        for stmt in ALTER_STATEMENTS:
            try:
                await conn.execute(text(stmt))
                print(f"  OK   {stmt}")
            except Exception as e:
                msg = str(e)
                if "duplicate column" in msg.lower() or "already exists" in msg.lower():
                    print(f"  skip {stmt} (already present)")
                else:
                    print(f"  WARN {stmt}: {e}")

        # 2) Create new tables for conversations/messages
        await conn.run_sync(
            lambda sync_conn: Base.metadata.create_all(
                sync_conn,
                tables=[Conversation.__table__, Message.__table__],
                checkfirst=True,
            )
        )
        print("  OK   conversations + messages tables ensured")

    print("Migration complete.")


if __name__ == "__main__":
    asyncio.run(main())
