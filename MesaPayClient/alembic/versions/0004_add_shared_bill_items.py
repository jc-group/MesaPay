"""add shared bill items

Revision ID: 0004_add_shared_bill_items
Revises: 0003_add_orders_and_payments
Create Date: 2026-02-26 23:05:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0004_add_shared_bill_items"
down_revision: Union[str, Sequence[str], None] = "0003_add_orders_and_payments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "session_line_items",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("session_id", sa.BigInteger(), nullable=False),
        sa.Column("member_id", sa.BigInteger(), nullable=True),
        sa.Column("menu_item_id", sa.BigInteger(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price_mxn", sa.Numeric(10, 2), nullable=False),
        sa.Column("total_price_mxn", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="unpaid"),
        sa.Column("paid_order_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["member_id"], ["session_members.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["menu_item_id"], ["menu_items.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["paid_order_id"], ["orders.id"], ondelete="SET NULL"),
    )
    op.create_index("idx_session_line_items_session_id", "session_line_items", ["session_id"], unique=False)
    op.create_index("idx_session_line_items_member_id", "session_line_items", ["member_id"], unique=False)
    op.create_index("idx_session_line_items_menu_item_id", "session_line_items", ["menu_item_id"], unique=False)
    op.create_index("idx_session_line_items_paid_order_id", "session_line_items", ["paid_order_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_session_line_items_paid_order_id", table_name="session_line_items")
    op.drop_index("idx_session_line_items_menu_item_id", table_name="session_line_items")
    op.drop_index("idx_session_line_items_member_id", table_name="session_line_items")
    op.drop_index("idx_session_line_items_session_id", table_name="session_line_items")
    op.drop_table("session_line_items")
