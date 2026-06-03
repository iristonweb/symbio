"""Ensure release tables exist on databases stamped from the old no-op launch migration.

Revision ID: 002_release_schema_sync
Revises: 001_launch
"""

from typing import Sequence, Union

from alembic import op

from app.db.base import Base
import app.db.models  # noqa: F401 - registers metadata

revision: str = "002_release_schema_sync"
down_revision: Union[str, None] = "001_launch"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)


def downgrade() -> None:
    # Intentionally non-destructive: this revision is a schema sync safety net
    # for already-stamped production databases.
    pass
