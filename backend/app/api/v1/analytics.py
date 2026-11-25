from fastapi import APIRouter, Query
from app.api.deps import DB, CurrentUser
from app.services import analytics as svc

router = APIRouter(prefix="/analytics", tags=["analytics"])
# tz_offset_minutes: minutes ahead of UTC (Bangladesh = 360) so "today" matches the user's clock.
TZ = Query(0, ge=-840, le=840)

@router.get("/summary")
def summary(db: DB, user: CurrentUser, tz_offset_minutes: int = TZ):
    return svc.summary(db, user, tz_offset_minutes)

@router.get("/weekly")
def weekly(db: DB, user: CurrentUser, tz_offset_minutes: int = TZ):
    return svc.weekly(db, user, tz_offset_minutes)

@router.get("/distractions")
def distractions(db: DB, user: CurrentUser):
    return svc.distraction_breakdown(db, user)
