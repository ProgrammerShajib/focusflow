from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings

# Some hosts (Neon, Heroku) give "postgres://"; SQLAlchemy wants "postgresql://".
url = settings.database_url.replace("postgres://", "postgresql://", 1)
engine = create_engine(url, pool_pre_ping=True,
                       connect_args={"check_same_thread": False} if url.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False)

class Base(DeclarativeBase):
    """Every model inherits this; Alembic reads Base.metadata to build migrations."""

def get_db():
    """FastAPI dependency: one DB session per request, always closed afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
