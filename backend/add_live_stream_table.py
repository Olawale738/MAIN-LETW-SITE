import asyncio
import os
from dotenv import load_dotenv

# Load .env file explicitly
load_dotenv()

from database import init_db
from models.live_stream import LiveStream

if __name__ == "__main__":
    print("Running migration for LiveStream table...")
    asyncio.run(init_db())
