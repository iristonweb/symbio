"""Launch schema — SYMBIO marketplace, auth, billing extensions.

Revision ID: 001_launch
"""

from typing import Sequence, Union

from alembic import op

from app.db.base import Base
import app.db.models  # noqa: F401 - registers all launch tables

revision: str = "001_launch"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind, checkfirst=True)
