"""score soft delete

Revision ID: 20260605_0001
Revises: 20260604_0006
Create Date: 2026-06-05
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "20260605_0001"
down_revision: Union[str, None] = "20260604_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("scores", sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column("scores", "is_deleted")