"""add orders and payments

Revision ID: 0003_add_orders_and_payments
Revises: 0002_seed_demo_data
Create Date: 2026-02-26 22:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003_add_orders_and_payments"
down_revision: Union[str, Sequence[str], None] = "0002_seed_demo_data"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("session_id", sa.BigInteger(), nullable=False),
        sa.Column("member_id", sa.BigInteger(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="paid"),
        sa.Column("subtotal_mxn", sa.Numeric(10, 2), nullable=False),
        sa.Column("service_fee_mxn", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("total_mxn", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="MXN"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["member_id"], ["session_members.id"], ondelete="SET NULL"),
    )
    op.create_index("idx_orders_session_id", "orders", ["session_id"], unique=False)
    op.create_index("idx_orders_member_id", "orders", ["member_id"], unique=False)

    op.create_table(
        "order_items",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("menu_item_id", sa.BigInteger(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price_mxn", sa.Numeric(10, 2), nullable=False),
        sa.Column("line_total_mxn", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["menu_item_id"], ["menu_items.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_order_items_order_id", "order_items", ["order_id"], unique=False)
    op.create_index("idx_order_items_menu_item_id", "order_items", ["menu_item_id"], unique=False)

    op.create_table(
        "payments",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("provider", sa.String(length=40), nullable=False, server_default="sandbox"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="approved"),
        sa.Column("amount_mxn", sa.Numeric(10, 2), nullable=False),
        sa.Column("card_holder_name", sa.String(length=120), nullable=False),
        sa.Column("card_last4", sa.String(length=4), nullable=False),
        sa.Column("card_brand", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_payments_order_id", "payments", ["order_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_payments_order_id", table_name="payments")
    op.drop_table("payments")
    op.drop_index("idx_order_items_menu_item_id", table_name="order_items")
    op.drop_index("idx_order_items_order_id", table_name="order_items")
    op.drop_table("order_items")
    op.drop_index("idx_orders_member_id", table_name="orders")
    op.drop_index("idx_orders_session_id", table_name="orders")
    op.drop_table("orders")
