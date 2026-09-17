import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.app.config import settings

logger = logging.getLogger("uvicorn")

# Strict PostgreSQL Engine Configuration
db_url = settings.DATABASE_URL

# Normalize postgres:// to postgresql+psycopg2:// if needed (e.g. cloud providers like Neon/Supabase)
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
except Exception as e:
    logger.error(f"FATAL: Failed to create SQLAlchemy engine with DATABASE_URL: {e}")
    raise RuntimeError(f"Database Engine Initialization Failed: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def check_db_connection() -> bool:
    """Explicitly verify that PostgreSQL is reachable. Fails loudly if unreachable."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            return result == 1
    except Exception as e:
        logger.error(f"PostgreSQL connection error: {e}")
        raise ConnectionError(
            f"FATAL: Could not connect to PostgreSQL at {settings.DATABASE_URL}. "
            f"Ensure PostgreSQL is running and credentials in .env are correct. Root error: {e}"
        )


def get_db():
    """Dependency for yielding database sessions per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
