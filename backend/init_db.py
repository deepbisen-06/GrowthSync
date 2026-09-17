#!/usr/bin/env python3
"""
Database Initialization Utility.
Connects to PostgreSQL, ensures the target database exists, and creates all defined tables.
"""

import os
import sys
from urllib.parse import urlparse

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import backend.app.models  # noqa: F401 -- Import all models to register with Base
from backend.app.config import settings
from backend.app.database import Base, engine


def ensure_database_exists():
    """Ensure that the PostgreSQL database specified in DATABASE_URL exists."""
    db_url = settings.DATABASE_URL
    # Replace dialect prefix for standard parsing
    clean_url = db_url.replace("postgresql+psycopg2://", "postgresql://")
    parsed = urlparse(clean_url)

    dbname = parsed.path.lstrip("/")
    user = parsed.username or "postgres"
    password = parsed.password or "postgres"
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432

    print(f"[*] Checking PostgreSQL database: '{dbname}' on {host}:{port}...")

    try:
        # Try direct connection to target DB first
        conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host, port=port)
        conn.close()
        print(f"[OK] Database '{dbname}' already exists.")
        return True
    except psycopg2.OperationalError as e:
        if "does not exist" in str(e):
            print(
                f"[*] Database '{dbname}' does not exist. Attempting to create it via 'postgres' admin DB..."
            )
            try:
                admin_conn = psycopg2.connect(
                    dbname="postgres", user=user, password=password, host=host, port=port
                )
                admin_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                cursor = admin_conn.cursor()
                cursor.execute(f'CREATE DATABASE "{dbname}";')
                cursor.close()
                admin_conn.close()
                print(f"[OK] Database '{dbname}' created successfully!")
                return True
            except Exception as create_err:
                print(f"[ERROR] Failed to automatically create database: {create_err}")
                raise
        else:
            raise


def init_tables():
    """Create all tables in PostgreSQL according to SQLAlchemy models."""
    print("[*] Creating SQLAlchemy tables in PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("[OK] All tables created successfully:")
    for table_name in Base.metadata.tables.keys():
        print(f"  - {table_name}")


def main():
    print("=" * 60)
    print("Infosys Milestone 1: PostgreSQL Database Initialization")
    print("=" * 60)
    try:
        ensure_database_exists()
        init_tables()
        print("\n[SUCCESS] PostgreSQL Database & Tables are fully initialized and ready!")
        print("=" * 60)
    except Exception as e:
        print(f"\n[FAILED] Database initialization error: {e}")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
