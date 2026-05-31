"""initial trivia tables

Revision ID: 20260531_0001
Revises:
Create Date: 2026-05-31
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260531_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_categories_id"), "categories", ["id"], unique=False)
    op.create_index(op.f("ix_categories_name"), "categories", ["name"], unique=False)

    op.create_table(
        "players",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_players_id"), "players", ["id"], unique=False)
    op.create_index(op.f("ix_players_name"), "players", ["name"], unique=False)

    op.create_table(
        "questions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("options", sa.JSON(), nullable=False),
        sa.Column("correct_answer", sa.String(length=255), nullable=False),
        sa.Column("time_limit_seconds", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_questions_category_id"), "questions", ["category_id"], unique=False)
    op.create_index(op.f("ix_questions_id"), "questions", ["id"], unique=False)
    op.create_index(op.f("ix_questions_is_active"), "questions", ["is_active"], unique=False)

    op.create_table(
        "quiz_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("total_questions", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_quiz_sessions_id"), "quiz_sessions", ["id"], unique=False)
    op.create_index(op.f("ix_quiz_sessions_player_id"), "quiz_sessions", ["player_id"], unique=False)

    op.create_table(
        "scores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("total_questions", sa.Integer(), nullable=False),
        sa.Column("completion_time_seconds", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["quiz_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id"),
    )
    op.create_index(op.f("ix_scores_id"), "scores", ["id"], unique=False)
    op.create_index(op.f("ix_scores_player_id"), "scores", ["player_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_scores_player_id"), table_name="scores")
    op.drop_index(op.f("ix_scores_id"), table_name="scores")
    op.drop_table("scores")
    op.drop_index(op.f("ix_quiz_sessions_player_id"), table_name="quiz_sessions")
    op.drop_index(op.f("ix_quiz_sessions_id"), table_name="quiz_sessions")
    op.drop_table("quiz_sessions")
    op.drop_index(op.f("ix_questions_is_active"), table_name="questions")
    op.drop_index(op.f("ix_questions_id"), table_name="questions")
    op.drop_index(op.f("ix_questions_category_id"), table_name="questions")
    op.drop_table("questions")
    op.drop_index(op.f("ix_players_name"), table_name="players")
    op.drop_index(op.f("ix_players_id"), table_name="players")
    op.drop_table("players")
    op.drop_index(op.f("ix_categories_name"), table_name="categories")
    op.drop_index(op.f("ix_categories_id"), table_name="categories")
    op.drop_table("categories")
