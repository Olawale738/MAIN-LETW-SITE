import asyncio
import sys
import logging
from sqlalchemy import select
from database import get_db, init_db, AsyncSessionLocal
from models.cms import CMSPage
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def verify_cms():
    print("Verifying CMS Persistence...")
    
    async with AsyncSessionLocal() as session:
        try:
            # Check if table exists by trying to select
            print("Checking if 'cms_pages' table exists...")
            result = await session.execute(select(CMSPage).limit(1))
            print("Table 'cms_pages' exists.")
            
            # Try to get 'sunday-service' page
            print("Checking for 'sunday-service' page...")
            stmt = select(CMSPage).where(CMSPage.slug == 'sunday-service')
            result = await session.execute(stmt)
            page = result.scalar_one_or_none()
            
            if page:
                print(f"Found 'sunday-service' page: {page.title}")
                print(f"Content length: {len(str(page.content))}")
            else:
                print("'sunday-service' page NOT found in DB.")
                
                # Try to create it
                print("Attempting to create 'sunday-service' page...")
                new_page = CMSPage(
                    slug='sunday-service',
                    title='Sunday Worship Service',
                    content='{"blocks": []}'
                )
                session.add(new_page)
                await session.commit()
                print("Created 'sunday-service' page.")
                
                # Verify creation
                result = await session.execute(stmt)
                page = result.scalar_one_or_none()
                if page:
                    print("Verification successful: Page created and retrieved.")
                else:
                    print("Verification FAILED: Page not found after creation.")
                    
        except Exception as e:
            print(f"Error during verification: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_cms())
