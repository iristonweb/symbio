"""Launch schema — SYMBIO marketplace, auth, billing extensions.

Revision ID: 001_launch
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_launch"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fresh installs use init_db create_all; migration documents launch DDL for existing DBs.
    pass


def downgrade() -> None:
    pass
