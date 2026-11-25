"""Business rules for sessions and distractions. Routers stay thin (HTTP only);
rules live here so they can be reused (CLI, background jobs) and tested alone."""
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import Distraction, FocusSession, ReturnEvent, User, utcnow

def aware(dt: datetime) -> datetime:
    """SQLite returns naive datetimes; treat them as UTC so subtraction works everywhere."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

def get_owned_session(db: Session, user: User, session_id: int) -> FocusSession:
    # Filtering by user_id is the security rule: you can never touch someone else's data.
    s = db.scalar(select(FocusSession).where(FocusSession.id == session_id, FocusSession.user_id == user.id))
    if not s:
        raise HTTPException(404, "Session not found")
    return s

def get_owned_distraction(db: Session, user: User, distraction_id: int) -> Distraction:
    d = db.scalar(select(Distraction).join(FocusSession).where(Distraction.id == distraction_id, FocusSession.user_id == user.id))
    if not d:
        raise HTTPException(404, "Distraction not found")
    return d

def finish_session(db: Session, s: FocusSession, focus_seconds: int, completed: bool) -> FocusSession:
    if s.status != "active":
        raise HTTPException(409, "Session already finished")
    s.focus_seconds, s.ended_at = focus_seconds, utcnow()
    s.status = "completed" if completed else "ended-early"
    db.commit(); db.refresh(s)
    return s

def record_return(db: Session, d: Distraction) -> Distraction:
    """Recovery time is computed by the SERVER (returned_at - occurred_at),
    so a client can't fake or corrupt the metric."""
    if d.return_event:
        raise HTTPException(409, "Return already recorded")
    now = utcnow()
    secs = max(0, int((now - aware(d.occurred_at)).total_seconds()))
    db.add(ReturnEvent(distraction_id=d.id, returned_at=now, recovery_duration_seconds=secs))
    db.commit(); db.refresh(d)
    return d
