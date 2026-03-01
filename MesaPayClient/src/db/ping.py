from sqlalchemy import text

from src.db.session import engine


def ping_database() -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
