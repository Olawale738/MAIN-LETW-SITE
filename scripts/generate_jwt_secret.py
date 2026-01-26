#!/usr/bin/env python3
"""
Generate a secure JWT secret for production use.
Run this and copy the output to your Render environment variables.
"""

import secrets

if __name__ == "__main__":
    secret = secrets.token_urlsafe(32)
    print("=" * 60)
    print("🔐 Generated JWT Secret:")
    print("=" * 60)
    print(secret)
    print("=" * 60)
    print("\n📋 Copy this value to your Render environment variables:")
    print(f"   JWT_SECRET={secret}")
    print("\n⚠️  Keep this secret safe! Don't commit it to git.")

