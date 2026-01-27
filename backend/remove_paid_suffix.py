
import asyncio
import sys
import os

# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select, update
from database import AsyncSessionLocal
from models.user import User
from models.service_request import ServiceRequest

async def migrate():
    print("Starting migration...")
    async with AsyncSessionLocal() as session:
        try:
            # 1. Update Users
            print("Checking users...")
            result = await session.execute(select(User))
            users = result.scalars().all()
            updated_users_count = 0
            
            for user in users:
                # Check directly in the list
                # Note: user.services is a list of strings
                if "Theology school (paid)" in user.services:
                    print(f"Updating user {user.email}...")
                    # Replace keeping order
                    new_services = []
                    for s in user.services:
                        if s == "Theology school (paid)":
                            # Check if "Theology school" is already there to avoid duplicates
                            if "Theology school" not in new_services and "Theology school" not in user.services:
                                new_services.append("Theology school")
                            elif "Theology school" in user.services:
                                # If they have both, just skip adding the new one as the other one will be/is added
                                pass
                        else:
                            new_services.append(s)
                    
                    # Deduplicate just in case logic above missed something simple
                    # primitive clear duplicates preserving order
                    seen = set()
                    final_services = []
                    for s in new_services:
                        if s not in seen:
                            final_services.append(s)
                            seen.add(s)

                    # Create a NEW list object to ensure SQLAlchemy detects change
                    user.services = list(final_services)
                    session.add(user)
                    updated_users_count += 1
            
            # 2. Update Service Requests
            print("Checking service requests...")
            stmt = (
                update(ServiceRequest)
                .where(ServiceRequest.service_name == "Theology school (paid)")
                .values(service_name="Theology school")
            )
            result = await session.execute(stmt)
            updated_requests_count = result.rowcount
            
            await session.commit()
            print(f"Migration completed successfully.")
            print(f"Updated {updated_users_count} users.")
            print(f"Updated {updated_requests_count} service requests.")
            
        except Exception as e:
            await session.rollback()
            print(f"Error during migration: {e}")
            raise

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(migrate())
