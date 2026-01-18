
import asyncio
import sys
import os
import argparse
from getpass import getpass

# Add the current directory to sys.path to resolve imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from database import AsyncSessionLocal, init_db
from models.user import User, UserRole, UserStatus
from utils.security import hash_password

async def create_admin_user(name, email, password):
    async with AsyncSessionLocal() as session:
        # Check if user exists
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            print(f"User with email {email} already exists.")
            if user.role == UserRole.ADMIN:
                print("User is already an admin.")
                return
            
            confirm = input(f"User exists with role {user.role}. Promote to admin? (y/n): ")
            if confirm.lower() != 'y':
                print("Aborted.")
                return
            
            user.role = UserRole.ADMIN
            # Update password if provided
            if password:
                user.password_hash = hash_password(password)
                user.status = UserStatus.ACTIVE # Ensure active if setting password
                print("Password and status updated.")
            
            await session.commit()
            print(f"User {email} promoted to admin successfully.")
            return

        # Create new admin user
        print(f"Creating new admin user: {email}")
        new_user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE
        )

        session.add(new_user)
        try:
            await session.commit()
            print(f"Admin user {email} created successfully.")
        except IntegrityError as e:
            await session.rollback()
            print(f"Error creating user: {e}")

async def main():
    parser = argparse.ArgumentParser(description="Create an admin user")
    parser.add_argument("--name", help="Name of the admin")
    parser.add_argument("--email", help="Email of the admin")
    parser.add_argument("--password", help="Password of the admin")
    
    args = parser.parse_args()

    print("Initializing database...")
    await init_db()  # Ensure tables exist

    name = args.name or input("Enter Name: ")
    email = args.email or input("Enter Email: ")
    password = args.password or getpass("Enter Password: ")

    if not all([name, email, password]):
        print("All fields are required.")
        return

    await create_admin_user(name, email, password)

if __name__ == "__main__":
    asyncio.run(main())
