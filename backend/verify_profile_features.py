import asyncio
import httpx
import sys

BASE_URL = "http://localhost:8000/api"

async def verify_features():
    print("🚀 Starting Profile Features Verification...")
    
    async with httpx.AsyncClient() as client:
        # 1. Login (assuming a test user exists or we create one)
        # We'll try to register first to ensure we have a user
        email = "test_profile@example.com"
        password = "Password123!"
        name = "Test User"
        
        print(f"\n1. Registering/Logging in as {email}...")
        
        # Try login first
        login_res = await client.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        
        token = ""
        
        if login_res.status_code == 200:
            print("✅ Login successful")
            token = login_res.json()["access_token"]
        else:
            print(f"Login failed: {login_res.status_code} - {login_res.text}")
            # Register if login fails (and we think user doesn't exist)
            print("Trying to register...")
            reg_res = await client.post(f"{BASE_URL}/auth/register", json={
                "name": name,
                "email": email
            })
            
            if reg_res.status_code == 201:
                print("✅ Registration successful")
                # We can't easily verify the email token in this script without access to DB/Email
                # So we might be stuck here if email verification is mandatory.
                # Let's check if we can bypass or if the user is auto-verified (usually not).
                print("⚠️  Registration complete, but email verification is required to login.")
                print("⚠️  Cannot proceed with authenticated tests without manual verification.")
                return
            else:
                print(f"❌ Registration failed: {reg_res.text}")
                return

        # Headers for authenticated requests
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Test Update Profile
        print(f"\n2. Testing Update Profile (PUT /users/me)...")
        new_name = "Updated Test User"
        update_res = await client.put(
            f"{BASE_URL}/users/me",
            json={"name": new_name},
            headers=headers
        )
        
        if update_res.status_code == 200 and update_res.json()["name"] == new_name:
            print("✅ Profile update successful")
        else:
            print(f"❌ Profile update failed: {update_res.text}")
            
        # 3. Test Change Password
        print(f"\n3. Testing Change Password (PUT /auth/change-password)...")
        new_password = "NewPassword123!"
        change_pw_res = await client.put(
            f"{BASE_URL}/auth/change-password",
            json={
                "current_password": password,
                "new_password": new_password
            },
            headers=headers
        )
        
        if change_pw_res.status_code == 200:
            print("✅ Password change successful")
            
            # Verify login with new password
            print("   Verifying login with new password...")
            new_login_res = await client.post(f"{BASE_URL}/auth/login", json={
                "email": email,
                "password": new_password
            })
            if new_login_res.status_code == 200:
                 print("✅ Login with new password successful")
                 # Revert password for re-runnability
                 new_token = new_login_res.json()["access_token"]
                 await client.put(
                    f"{BASE_URL}/auth/change-password",
                    json={
                        "current_password": new_password,
                        "new_password": password
                    },
                    headers={"Authorization": f"Bearer {new_token}"}
                )
                 print("   (Password reverted for future tests)")
            else:
                 print(f"❌ Login with new password failed: {new_login_res.text}")
        else:
            print(f"❌ Password change failed: {change_pw_res.text}")

        # 4. Test Forgot Password
        print(f"\n4. Testing Forgot Password (POST /auth/forgot-password)...")
        forgot_res = await client.post(f"{BASE_URL}/auth/forgot-password", json={
            "email": email
        })
        
        if forgot_res.status_code == 200:
            print("✅ Forgot password request successful")
        else:
            print(f"❌ Forgot password request failed: {forgot_res.text}")

    print("\n🏁 Verification Complete")

if __name__ == "__main__":
    asyncio.run(verify_features())
