#!/usr/bin/env python3
"""
Database connection diagnostic script for Render deployment.
Run this in Render Shell to diagnose connection issues.
"""

import os
import sys
from urllib.parse import urlparse

def diagnose_database_url():
    """Check DATABASE_URL configuration"""
    print("=" * 60)
    print("🔍 Database Connection Diagnostics")
    print("=" * 60)
    print()
    
    # Check if DATABASE_URL exists
    db_url = os.getenv('DATABASE_URL')
    
    if not db_url:
        print("❌ ERROR: DATABASE_URL environment variable is not set!")
        print()
        print("Fix: Set DATABASE_URL in Render Environment tab")
        print("Use the Internal Database URL from your PostgreSQL service")
        return False
    
    print("✅ DATABASE_URL is set")
    print()
    
    # Parse the URL
    try:
        parsed = urlparse(db_url)
        print(f"📊 Connection Details:")
        print(f"   Scheme: {parsed.scheme}")
        print(f"   Host: {parsed.hostname}")
        print(f"   Port: {parsed.port}")
        print(f"   Database: {parsed.path.lstrip('/')}")
        print(f"   Username: {parsed.username}")
        print()
    except Exception as e:
        print(f"❌ ERROR: Could not parse DATABASE_URL: {e}")
        return False
    
    # Check scheme
    if parsed.scheme == 'postgresql+asyncpg':
        print("✅ Correct scheme: postgresql+asyncpg")
    elif parsed.scheme == 'postgresql':
        print("❌ ERROR: Wrong scheme!")
        print("   Current: postgresql://")
        print("   Required: postgresql+asyncpg://")
        print()
        print("Fix: Add '+asyncpg' after 'postgresql' in DATABASE_URL")
        return False
    else:
        print(f"❌ ERROR: Unknown scheme: {parsed.scheme}")
        return False
    
    print()
    
    # Check if using internal URL
    if parsed.hostname and 'dpg-' in parsed.hostname:
        print("✅ Using Internal Database URL (correct)")
    elif parsed.hostname and 'external' in parsed.hostname:
        print("⚠️  WARNING: Using External Database URL")
        print("   For better performance, use Internal URL")
        print("   (hostname should start with 'dpg-')")
    else:
        print(f"⚠️  Unknown hostname pattern: {parsed.hostname}")
    
    print()
    
    # Check port
    if parsed.port == 5432:
        print("✅ Correct port: 5432")
    else:
        print(f"⚠️  Unusual port: {parsed.port} (expected 5432)")
    
    print()
    print("=" * 60)
    print("🎯 Summary")
    print("=" * 60)
    
    if parsed.scheme == 'postgresql+asyncpg' and parsed.hostname:
        print("✅ Configuration looks good!")
        print()
        print("If you're still getting connection errors:")
        print("1. Verify backend and database are in the same region")
        print("2. Check Render status page: https://status.render.com")
        print("3. Try redeploying the service")
        return True
    else:
        print("❌ Configuration has issues - see errors above")
        return False

if __name__ == "__main__":
    success = diagnose_database_url()
    sys.exit(0 if success else 1)

