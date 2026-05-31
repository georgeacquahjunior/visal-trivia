"""user logins

Revision ID: 20260531_0003
Revises: 20260531_0002
Create Date: 2026-05-31
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260531_0003"
down_revision: Union[str, None] = "20260531_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_logins",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("google_sub", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=30), nullable=False),
        sa.Column("picture", sa.String(length=500), nullable=True),
        sa.Column("logged_in_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_logins_email"), "user_logins", ["email"], unique=False)
    op.create_index(op.f("ix_user_logins_google_sub"), "user_logins", ["google_sub"], unique=False)
    op.create_index(op.f("ix_user_logins_id"), "user_logins", ["id"], unique=False)
    op.create_index(op.f("ix_user_logins_name"), "user_logins", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_logins_name"), table_name="user_logins")
    op.drop_index(op.f("ix_user_logins_id"), table_name="user_logins")
    op.drop_index(op.f("ix_user_logins_google_sub"), table_name="user_logins")
    op.drop_index(op.f("ix_user_logins_email"), table_name="user_logins")
    op.drop_table("user_logins")
