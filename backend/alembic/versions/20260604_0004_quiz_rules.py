"""quiz rules

Revision ID: 20260604_0004
Revises: 20260531_0004
Create Date: 2026-06-04
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "20260604_0004"
down_revision: Union[str, None] = "20260531_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("quiz_settings", sa.Column("attempts_allowed", sa.Integer(), nullable=False, server_default="3"))
    op.add_column("quiz_settings", sa.Column("pass_percentage", sa.Integer(), nullable=False, server_default="70"))
    op.add_column("quiz_settings", sa.Column("reward_tokens", sa.Integer(), nullable=False, server_default="10"))


def downgrade() -> None:
    op.drop_column("quiz_settings", "reward_tokens")
    op.drop_column("quiz_settings", "pass_percentage")
    op.drop_column("quiz_settings", "attempts_allowed")
