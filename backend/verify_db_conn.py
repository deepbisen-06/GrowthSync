#!/usr/bin/env python3
"""
Checkpoint A: Standalone PostgreSQL Connection Verification Script.
Tests connectivity to PostgreSQL defined in .env and prints detailed diagnostics.
Fails with non-zero exit code if PostgreSQL is unreachable.
"""

import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.config import settings
from backend.app.database import check_db_connection


def main():
    print("=" * 60)
    print("Infosys Milestone 1 - Checkpoint A: PostgreSQL Connection Test")
    print("=" * 60)
    # Mask password for security
    url = settings.DATABASE_URL
    masked_url = url
    if "@" in url:
        prefix, rest = url.split("@", 1)
        if ":" in prefix:
            proto_user = prefix.rsplit(":", 1)[0]
            masked_url = f"{proto_user}:****@{rest}"

    print(f"Target Database URL : {masked_url}")
    print(f"Environment         : {settings.ENVIRONMENT}")
    print("Attempting connection to PostgreSQL...")

    try:
        if check_db_connection():
            print("\n[SUCCESS] [OK] Successfully connected to PostgreSQL!")
            print("Database is ready for Checkpoint B (User Registration & Models).")
            print("=" * 60)
            sys.exit(0)
    except ConnectionError as ce:
        print("\n[FAILED] [ERROR] Could not connect to PostgreSQL database.")
        print(f"Details: {ce}")
        print("\nPlease ensure that:")
        print(
            "1. PostgreSQL server is running locally OR a cloud PostgreSQL URL (e.g. Neon / Supabase) is provided in .env."
        )
        print("2. The database name exists (e.g., 'CREATE DATABASE infosys_deep;').")
        print("3. Credentials in .env match your PostgreSQL configuration.")
        print("=" * 60)
        sys.exit(1)
    except Exception as e:
        print(f"\n[FAILED] [UNEXPECTED ERROR] {e}")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
