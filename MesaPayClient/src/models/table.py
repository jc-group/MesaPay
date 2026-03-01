from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


class Table(Base):
    __tablename__ = "tables"
    __table_args__ = (
        UniqueConstraint("qr_token", name="ux_tables_qr_token"),
        UniqueConstraint("restaurant_id", "table_number", name="uq_tables_restaurant_table_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    table_number: Mapped[str] = mapped_column(String(32), nullable=False)
    qr_token: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    restaurant = relationship("Restaurant", back_populates="tables")
    sessions = relationship("Session", back_populates="table", cascade="all, delete-orphan")
