"""create initial tables

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-02-26 21:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS public")

    op.create_table(
        "restaurants",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "tables",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("restaurant_id", sa.BigInteger(), nullable=False),
        sa.Column("table_number", sa.String(length=32), nullable=False),
        sa.Column("qr_token", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("qr_token", name="ux_tables_qr_token"),
        sa.UniqueConstraint("restaurant_id", "table_number", name="uq_tables_restaurant_table_number"),
    )
    op.create_index("idx_tables_restaurant_id", "tables", ["restaurant_id"], unique=False)

    op.create_table(
        "sessions",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("table_id", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["table_id"], ["tables.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_sessions_table_id", "sessions", ["table_id"], unique=False)

    op.create_table(
        "menu_categories",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("restaurant_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_menu_categories_restaurant_id", "menu_categories", ["restaurant_id"], unique=False)

    op.create_table(
        "menu_items",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("category_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price_mxn", sa.Numeric(10, 2), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["menu_categories.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_menu_items_category_id", "menu_items", ["category_id"], unique=False)

    op.create_table(
        "session_members",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("session_id", sa.BigInteger(), nullable=False),
        sa.Column("guest_name", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_session_members_session_id", "session_members", ["session_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_session_members_session_id", table_name="session_members")
    op.drop_table("session_members")
    op.drop_index("idx_menu_items_category_id", table_name="menu_items")
    op.drop_table("menu_items")
    op.drop_index("idx_menu_categories_restaurant_id", table_name="menu_categories")
    op.drop_table("menu_categories")
    op.drop_index("idx_sessions_table_id", table_name="sessions")
    op.drop_table("sessions")
    op.drop_index("idx_tables_restaurant_id", table_name="tables")
    op.drop_table("tables")
    op.drop_table("restaurants")
