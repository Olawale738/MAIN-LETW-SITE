import asyncio
import sys
from sqlalchemy import select
from database import AsyncSessionLocal
from models.user import User, UserStatus
from utils.security import hash_password

async def approve_user(email: str):
    print(f"🔍 Looking for user with email: {email}")
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print("❌ User not found.")
            return
        
        print(f"✅ Found user: {user.name} (ID: {user.id})")
        print(f"   Current status: {user.status}")
        
        # Determine if we need to update anything
        needs_update = False
        
        if user.status != UserStatus.ACTIVE:
            user.status = UserStatus.ACTIVE
            user.email_verified = True # Just in case if it exists, though model didn't explicitly show it, safe to ignore if not there or let sqlalchemy fail if strict? 
            # Reviewing model earlier: status is enum. no is_verified.
            needs_update = True
            print("   Marking as ACTIVE.")
            
        if not user.password_hash:
            print("   Setting default password: Password123!")
            user.password_hash = hash_password("Password123!")
            needs_update = True
        
        if needs_update:
            await session.commit()
            print("✨ User updated successfully.")
        else:
            print("   User is already ACTIVE and has a password.")

if __name__ == "__main__":
    email = "test_profile@example.com"
    if len(sys.argv) > 1:
        email = sys.argv[1]
    asyncio.run(approve_user(email))
