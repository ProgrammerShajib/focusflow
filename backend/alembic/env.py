"""Alembic = version control for the database schema.
`revision --autogenerate` compares models with the real DB and writes a migration."""
from alembic import context
from app.core.database import Base, engine
import app.models  # noqa: F401  (importing registers all tables on Base.metadata)

with engine.connect() as conn:
    context.configure(connection=conn, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()
