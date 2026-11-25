from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from app.api.deps import DB, CurrentUser
from app.models import DailyGoal, DailyReflection
from app.schemas import GoalIn, GoalOut, ReflectionIn, ReflectionOut

reflections_router = APIRouter(prefix="/reflections", tags=["reflections"])
goals_router = APIRouter(prefix="/goals", tags=["goals"])

@reflections_router.post("", response_model=ReflectionOut, status_code=201)
def save_reflection(body: ReflectionIn, db: DB, user: CurrentUser):
    # Upsert: posting again for the same date edits that day's entry instead of failing.
    r = db.scalar(select(DailyReflection).where(DailyReflection.user_id == user.id, DailyReflection.reflection_date == body.reflection_date))
    if r:
        for k, v in body.model_dump().items(): setattr(r, k, v)
    else:
        r = DailyReflection(user_id=user.id, **body.model_dump()); db.add(r)
    db.commit(); db.refresh(r)
    return r

@reflections_router.get("", response_model=list[ReflectionOut])
def list_reflections(db: DB, user: CurrentUser):
    return db.scalars(select(DailyReflection).where(DailyReflection.user_id == user.id).order_by(DailyReflection.reflection_date.desc())).all()

@reflections_router.get("/{reflection_id}", response_model=ReflectionOut)
def get_reflection(reflection_id: int, db: DB, user: CurrentUser):
    r = db.scalar(select(DailyReflection).where(DailyReflection.id == reflection_id, DailyReflection.user_id == user.id))
    if not r:
        raise HTTPException(404, "Reflection not found")
    return r

@goals_router.post("", response_model=GoalOut, status_code=201)
def save_goal(body: GoalIn, db: DB, user: CurrentUser):
    g = db.scalar(select(DailyGoal).where(DailyGoal.user_id == user.id, DailyGoal.goal_date == body.goal_date))
    if g:
        for k, v in body.model_dump().items(): setattr(g, k, v)
    else:
        g = DailyGoal(user_id=user.id, **body.model_dump()); db.add(g)
    db.commit(); db.refresh(g)
    return g

@goals_router.get("", response_model=list[GoalOut])
def list_goals(db: DB, user: CurrentUser):
    return db.scalars(select(DailyGoal).where(DailyGoal.user_id == user.id).order_by(DailyGoal.goal_date.desc())).all()
