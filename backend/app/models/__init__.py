"""Database tables (SQLAlchemy). One class = one table, matching SRS section 7.
Categories are plain strings validated by Pydantic, so adding a category
later needs NO migration (Postgres ENUMs make that painful)."""
from datetime import date, datetime, timezone
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class FocusSession(Base):
    __tablename__ = "focus_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    task_title: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(20))
    planned_duration: Mapped[int] = mapped_column(Integer)          # minutes
    focus_seconds: Mapped[int] = mapped_column(Integer, default=0)  # actual focused time
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | completed | ended-early
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    distractions: Mapped[list["Distraction"]] = relationship(back_populates="session", cascade="all, delete-orphan")

class Distraction(Base):
    __tablename__ = "distractions"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("focus_sessions.id"), index=True)
    category: Mapped[str] = mapped_column(String(40))
    intensity: Mapped[str] = mapped_column(String(10), default="Easy")
    note: Mapped[str] = mapped_column(Text, default="")
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    session: Mapped[FocusSession] = relationship(back_populates="distractions")
    return_event: Mapped["ReturnEvent | None"] = relationship(back_populates="distraction", uselist=False, cascade="all, delete-orphan")

class ReturnEvent(Base):
    """'I noticed, and I came back.' unique=True enforces one return per distraction."""
    __tablename__ = "return_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    distraction_id: Mapped[int] = mapped_column(ForeignKey("distractions.id"), unique=True)
    returned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    recovery_duration_seconds: Mapped[int] = mapped_column(Integer)
    distraction: Mapped[Distraction] = relationship(back_populates="return_event")

class DailyReflection(Base):
    __tablename__ = "daily_reflections"
    __table_args__ = (UniqueConstraint("user_id", "reflection_date"),)  # one per day
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    reflection_date: Mapped[date] = mapped_column(Date)
    distractions_summary: Mapped[str] = mapped_column(Text, default="")
    successful_strategies: Mapped[str] = mapped_column(Text, default="")
    achievements: Mapped[str] = mapped_column(Text, default="")
    improvements: Mapped[str] = mapped_column(Text, default="")

class DailyGoal(Base):
    __tablename__ = "daily_goals"
    __table_args__ = (UniqueConstraint("user_id", "goal_date"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    goal_date: Mapped[date] = mapped_column(Date)
    target_focus_minutes: Mapped[int] = mapped_column(Integer, default=0)
    target_sessions: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
