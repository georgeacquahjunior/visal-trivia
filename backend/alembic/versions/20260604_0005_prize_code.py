"""prize code setting

Revision ID: 20260604_0005
Revises: 20260604_0004
Create Date: 2026-06-04
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "20260604_0005"
down_revision: Union[str, None] = "20260604_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("quiz_settings", sa.Column("prize_code", sa.String(length=120), nullable=False, server_default=""))


def downgrade() -> None:
    op.drop_column("quiz_settings", "prize_code")
