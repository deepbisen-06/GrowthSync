"""
Safe PostgreSQL Schema Migration Runner.
Applies incremental, idempotent migrations preserving existing data.
Does not drop or alter existing Milestone 1 columns.
"""

from sqlalchemy import text

from backend.app.database import engine

MIGRATIONS = [
    (
        "001_create_expense_records_table",
        """
        CREATE TABLE IF NOT EXISTS expense_records (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            amount DOUBLE PRECISION NOT NULL,
            category VARCHAR(50) NOT NULL,
            expense_date DATE NOT NULL,
            description VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS ix_expense_records_user_id ON expense_records (user_id);
        CREATE INDEX IF NOT EXISTS ix_expense_records_category ON expense_records (category);
        CREATE INDEX IF NOT EXISTS ix_expense_records_expense_date ON expense_records (expense_date);
        """,
    ),
    (
        "002_add_study_habit_performance_indices",
        """
        CREATE INDEX IF NOT EXISTS ix_study_records_study_date ON study_records (study_date);
        CREATE INDEX IF NOT EXISTS ix_habit_records_record_date ON habit_records (record_date);
        """,
    ),
]


def run_migrations():
    """Run all pending migrations in PostgreSQL safely."""
    print("[*] Checking PostgreSQL schema migrations...")
    with engine.begin() as conn:
        # 1. Ensure migrations tracking table exists
        conn.execute(
            text("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(100) PRIMARY KEY,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        """)
        )

        # 2. Get list of already applied migrations
        result = conn.execute(text("SELECT version FROM schema_migrations;"))
        applied_versions = {row[0] for row in result.fetchall()}

        # 3. Apply pending migrations sequentially
        for version, sql_statements in MIGRATIONS:
            if version not in applied_versions:
                print(f"[*] Applying migration: {version}...")
                for stmt in sql_statements.strip().split(";"):
                    clean_stmt = stmt.strip()
                    if clean_stmt:
                        conn.execute(text(clean_stmt))
                conn.execute(
                    text("INSERT INTO schema_migrations (version) VALUES (:ver);"), {"ver": version}
                )
                print(f"[OK] Migration {version} applied successfully.")
            else:
                print(f"[+] Migration {version} already applied.")

    print("[OK] Schema migrations verified and up to date.")


if __name__ == "__main__":
    run_migrations()
