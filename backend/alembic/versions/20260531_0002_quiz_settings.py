"""quiz settings

Revision ID: 20260531_0002
Revises: 20260531_0001
Create Date: 2026-05-31
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260531_0002"
down_revision: Union[str, None] = "20260531_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "quiz_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("question_limit", sa.Integer(), nullable=False),
        sa.Column("quiz_time_seconds", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute("INSERT INTO quiz_settings (id, question_limit, quiz_time_seconds) VALUES (1, 7, 150)")


def downgrade() -> None:
    op.drop_table("quiz_settings")
