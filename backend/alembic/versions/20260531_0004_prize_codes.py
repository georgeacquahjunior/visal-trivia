"""prize codes

Revision ID: 20260531_0004
Revises: 20260531_0003
Create Date: 2026-05-31
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "20260531_0004"
down_revision: Union[str, None] = "20260531_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "prize_codes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=120), nullable=False),
        sa.Column("is_used", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("claimed_by", sa.String(length=120), nullable=True),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index(op.f("ix_prize_codes_code"), "prize_codes", ["code"], unique=True)
    op.create_index(op.f("ix_prize_codes_id"), "prize_codes", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_prize_codes_id"), table_name="prize_codes")
    op.drop_index(op.f("ix_prize_codes_code"), table_name="prize_codes")
    op.drop_table("prize_codes")
