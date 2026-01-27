#!/usr/bin/env python3
"""
Test script to verify SMTP email configuration.
Run this locally or in Render Shell to test email sending.

Usage:
    python test_email.py your-email@example.com
"""

import asyncio
import sys
from services.email_service import send_email
from config import settings


async def test_email_config(recipient_email: str):
    """Test email configuration by sending a test email."""
    
    print("\n" + "=" * 60)
    print("📧 SMTP Email Configuration Test")
    print("=" * 60)
    
    # Display current configuration (hide password)
    print(f"\n📋 Current Configuration:")
    print(f"   EMAIL_ENABLED: {settings.EMAIL_ENABLED}")
    print(f"   SMTP_HOST: {settings.SMTP_HOST}")
    print(f"   SMTP_PORT: {settings.SMTP_PORT}")
    print(f"   SMTP_USER: {settings.SMTP_USER}")
    print(f"   SMTP_PASSWORD: {'*' * len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else '(not set)'}")
    print(f"   EMAIL_FROM_NAME: {settings.EMAIL_FROM_NAME}")
    print(f"   EMAIL_FROM_ADDRESS: {settings.EMAIL_FROM_ADDRESS}")
    
    if not settings.EMAIL_ENABLED:
        print("\n⚠️  EMAIL_ENABLED is False - emails will only be logged to console")
        print("   Set EMAIL_ENABLED=true in environment variables to send real emails")
    
    print(f"\n📤 Sending test email to: {recipient_email}")
    print("-" * 60)
    
    # Send test email
    subject = "Test Email - Light Encounter Tabernacle"
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #140152;">✅ Email Configuration Test Successful!</h2>
            <p>If you're reading this, your SMTP email configuration is working correctly.</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
                <li>SMTP Host: {smtp_host}</li>
                <li>SMTP Port: {smtp_port}</li>
                <li>From: {from_address}</li>
            </ul>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This is a test email from Light Encounter Tabernacle application.
            </p>
        </div>
    </body>
    </html>
    """.format(
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        from_address=settings.EMAIL_FROM_ADDRESS
    )
    
    success = await send_email(recipient_email, subject, html_content)
    
    print("-" * 60)
    if success:
        print("\n✅ SUCCESS! Email sent successfully.")
        if settings.EMAIL_ENABLED:
            print(f"   Check {recipient_email} inbox for the test email.")
        else:
            print("   Email was logged to console (EMAIL_ENABLED=False)")
    else:
        print("\n❌ FAILED! Email could not be sent.")
        print("\n🔍 Troubleshooting Tips:")
        print("   1. Verify SMTP credentials are correct")
        print("   2. Check if SMTP_HOST and SMTP_PORT are correct")
        print("   3. Ensure firewall allows outbound connections on the SMTP port")
        print("   4. Try port 465 (SSL) if using 587 (TLS) or vice versa")
        print("   5. Check Render logs for detailed error messages")
    
    print("=" * 60 + "\n")
    return success


def main():
    if len(sys.argv) < 2:
        print("\n❌ Error: Please provide recipient email address")
        print(f"\nUsage: python {sys.argv[0]} your-email@example.com\n")
        sys.exit(1)
    
    recipient = sys.argv[1]
    
    # Validate email format (basic check)
    if "@" not in recipient or "." not in recipient:
        print(f"\n❌ Error: '{recipient}' doesn't look like a valid email address\n")
        sys.exit(1)
    
    # Run the test
    success = asyncio.run(test_email_config(recipient))
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

