"""Controlled schema migration runner for the EnerSight SQLAlchemy schema.

The runner records applied revisions in PostgreSQL and is deliberately invoked
as a deployment step, not by the API process.
"""

from __future__ import annotations

from sqlalchemy import text

from .core import engine
from .models import Base
from .telemetry import log_event

INITIAL_REVISION = "0001_initial_schema"


# PUBLIC_INTERFACE
def upgrade() -> None:
    """Apply the initial versioned schema revision exactly once.

    Run with ``python -m app.migrations`` from the backend directory after
    deployment configuration supplies DATABASE_URL.
    """
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS schema_migration "
                "(revision VARCHAR(64) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)"
            )
        )
        applied = connection.execute(
            text("SELECT revision FROM schema_migration WHERE revision = :revision"),
            {"revision": INITIAL_REVISION},
        ).scalar_one_or_none()
        if applied is None:
            Base.metadata.create_all(bind=connection)
            connection.execute(
                text("INSERT INTO schema_migration (revision) VALUES (:revision)"),
                {"revision": INITIAL_REVISION},
            )
            log_event(
                "schema_migration_applied",
                process_role="migration",
                resource_type="schema_migration",
                resource_id=INITIAL_REVISION,
                outcome="completed",
            )
        else:
            log_event(
                "schema_migration_skipped",
                process_role="migration",
                resource_type="schema_migration",
                resource_id=INITIAL_REVISION,
                outcome="already_applied",
            )


if __name__ == "__main__":
    upgrade()
