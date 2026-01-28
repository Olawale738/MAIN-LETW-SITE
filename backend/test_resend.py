"""
Quick test script to verify Resend email is working.
Usage: python test_resend.py your-email@example.com
"""

import sys
import asyncio
from services.email_service import send_email
from config import settings

async def test_resend(to_email: str):
    """Test sending an email via Resend."""
    
    print("\n" + "=" * 60)
    print("🧪 TESTING RESEND EMAIL")
    print("=" * 60)
    print(f"To: {to_email}")
    print(f"From: {settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>")
    print(f"Email Enabled: {settings.EMAIL_ENABLED}")
    print(f"Resend API Key: {settings.RESEND_API_KEY[:10]}..." if settings.RESEND_API_KEY else "NOT SET")
    print("=" * 60 + "\n")
    
    subject = "Test Email from Light Encounter Tabernacle"
    html_content = """
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #4F46E5;">✅ Resend Email Test Successful!</h2>
            <p>This is a test email from your Light Encounter Tabernacle application.</p>
            <p>If you're reading this, it means Resend is configured correctly! 🎉</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
                Sent via Resend API<br>
                Light Encounter Tabernacle Church Management System
            </p>
        </body>
    </html>
    """
    
    success = await send_email(to_email, subject, html_content)
    
    if success:
        print("\n✅ EMAIL SENT SUCCESSFULLY!")
        print("📬 Check your inbox (and spam folder)")
        print("📊 View delivery status: https://resend.com/emails")
    else:
        print("\n❌ EMAIL FAILED TO SEND")
        print("Check the error messages above")
    
    return success


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_resend.py your-email@example.com")
        sys.exit(1)
    
    to_email = sys.argv[1]
    asyncio.run(test_resend(to_email))

