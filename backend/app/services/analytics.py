"""Read-only statistics. Day-based numbers use the caller's timezone offset
(Bangladesh = 360) so "today" means the user's today, not UTC's.
Personal-scale data is aggregated in Python for clarity; move to SQL GROUP BY if it grows."""
from collections import Counter
from datetime import date, timedelta
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models import Distraction, FocusSession, ReturnEvent, User, utcnow
from app.services.focus import aware

def _day(dt, off: int) -> date:
    return (aware(dt) + timedelta(minutes=off)).date()

def _finished(db: Session, user: User):
    return db.execute(select(FocusSession.ended_at, FocusSession.focus_seconds)
                      .where(FocusSession.user_id == user.id, FocusSession.ended_at.is_not(None))).all()

def _streaks(days: set[date], today: date) -> tuple[int, int]:
    cur, d = 0, today if today in days else today - timedelta(days=1)
    while d in days:
        cur += 1; d -= timedelta(days=1)
    longest = run = 0
    for i, day in enumerate(sorted(days)):
        run = run + 1 if i and day - timedelta(days=1) in days else 1
        longest = max(longest, run)
    return cur, longest

def summary(db: Session, user: User, off: int = 0) -> dict:
    today = _day(utcnow(), off)
    rows = _finished(db, user)
    d_times = db.scalars(select(Distraction.occurred_at).join(FocusSession).where(FocusSession.user_id == user.id)).all()
    returns, avg = db.execute(select(func.count(ReturnEvent.id), func.avg(ReturnEvent.recovery_duration_seconds))
        .join(Distraction).join(FocusSession).where(FocusSession.user_id == user.id)).one()
    cur, longest = _streaks({_day(r.ended_at, off) for r in rows}, today)
    return {
        "total_focus_seconds": sum(r.focus_seconds for r in rows),
        "sessions_finished": len(rows), "total_distractions": len(d_times),
        "successful_returns": returns, "avg_return_seconds": round(avg or 0),
        "today_focus_seconds": sum(r.focus_seconds for r in rows if _day(r.ended_at, off) == today),
        "today_sessions": sum(1 for r in rows if _day(r.ended_at, off) == today),
        "today_distractions": sum(1 for t in d_times if _day(t, off) == today),
        "current_streak": cur, "longest_streak": longest,
    }

def weekly(db: Session, user: User, off: int = 0) -> list[dict]:
    today, rows = _day(utcnow(), off), _finished(db, user)
    d_times = db.scalars(select(Distraction.occurred_at).join(FocusSession).where(FocusSession.user_id == user.id)).all()
    out = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        out.append({"date": day, "focus_minutes": round(sum(r.focus_seconds for r in rows if _day(r.ended_at, off) == day) / 60),
                    "distractions": sum(1 for t in d_times if _day(t, off) == day)})
    return out

def distraction_breakdown(db: Session, user: User) -> list[dict]:
    kinds = db.scalars(select(Distraction.category).join(FocusSession).where(FocusSession.user_id == user.id)).all()
    return [{"category": k, "count": n} for k, n in Counter(kinds).most_common()]
