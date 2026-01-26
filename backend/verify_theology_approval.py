
import asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from main import app
from database import AsyncSessionLocal
from models.user import User, UserRole, UserStatus
from models.service_request import ServiceRequest, ServiceRequestStatus
from utils.security import hash_password

async def run_verification():
    print("🚀 Starting Theology School Auto-Approval Verification...")
    
    # 1. Create a Test User
    email = f"test_theology_{uuid.uuid4()}@example.com"
    password = "password123"
    hashed_password = hash_password(password)
    
    async with AsyncSessionLocal() as db:
        user = User(
            email=email,
            name="Test User",
            password_hash=hashed_password,
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            services=[]
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        user_id = user.id
        print(f"✅ Created test user: {email}")

    try:
        # 2. Login
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            login_response = await client.post("/api/auth/login", json={
                "email": email,
                "password": password
            })
            if login_response.status_code != 200:
                print(f"❌ Login failed: {login_response.text}")
                return
            
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("✅ Logged in successfully")
            
            # 3. Request Theology School Service
            # Also request "Choir" to verify mixed behavior (one approved, one pending)
            services_to_request = ["Theology school", "Choir"]
            print(f"📝 Requesting services: {services_to_request}")
            request_response = await client.post(
                "/api/service-requests", 
                json={"services": services_to_request},
                headers=headers
            )
            
            # 4. Verify Response
            if request_response.status_code != 201:
                 print(f"❌ Request failed: {request_response.text}")
                 return
            
            response_data = request_response.json()
            print(f"📄 Response: {response_data['message']}")
            
            # Check message indicating auto-approval
            if "Successfully joined" not in response_data['message']:
                print("❌ Response message does not indicate success/joining.")
                return
            
            # 5. Verify User State via API
            me_response = await client.get("/api/users/me", headers=headers)
            me_data = me_response.json()
            
            current_services = me_data["services"]
            if "Theology school" in current_services:
                print("✅ 'Theology school' is in user's services list via API.")
            else:
                print(f"❌ 'Theology school' NOT in services list. Services: {current_services}")
                
            if "Choir" in current_services:
                print("❌ 'Choir' SHOULD NOT be in services list yet (should be pending).")
            else:
                 print("✅ 'Choir' is correctly NOT in services list yet.")

        # 6. Verify Database State
        async with AsyncSessionLocal() as db:
            # Check Theology Request Status
            theology_req = await db.execute(
                select(ServiceRequest).where(
                    ServiceRequest.user_id == user_id,
                    ServiceRequest.service_name == "Theology school"
                )
            )
            theology_req = theology_req.scalar_one_or_none()
            
            if theology_req and theology_req.status == ServiceRequestStatus.APPROVED:
                print(f"✅ DB: Theology school request is APPROVED.")
            else:
                status = theology_req.status if theology_req else "None"
                print(f"❌ DB: Theology school request status is {status}, expected APPROVED.")

            # Check Choir Request Status
            choir_req = await db.execute(
                select(ServiceRequest).where(
                    ServiceRequest.user_id == user_id,
                    ServiceRequest.service_name == "Choir"
                )
            )
            choir_req = choir_req.scalar_one_or_none()
            
            if choir_req and choir_req.status == ServiceRequestStatus.PENDING:
                print(f"✅ DB: Choir request is PENDING.")
            else:
                status = choir_req.status if choir_req else "None"
                print(f"❌ DB: Choir request status is {status}, expected PENDING.")
            
    finally:
        # Cleanup
        async with AsyncSessionLocal() as db:
            # Delete user (cascades to requests usually, but let's be safe)
            u = await db.get(User, user_id)
            if u:
                await db.delete(u)
                await db.commit()
                print("🧹 Test user cleanup complete.")

if __name__ == "__main__":
    asyncio.run(run_verification())
