import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.db.url import normalize_database_url

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL is required")

engine = create_engine(normalize_database_url(database_url), future=True)
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
    expire_on_commit=False,
)
