from fastapi import APIRouter, Query
from sqlalchemy import select
from app.api.deps import DB, CurrentUser
from app.models import Distraction, FocusSession
from app.schemas import (DistractionCreate, DistractionOut, SessionCreate, SessionFinish, SessionOut, SessionUpdate)
from app.services import focus as svc

sessions_router = APIRouter(prefix="/sessions", tags=["sessions"])
distractions_router = APIRouter(prefix="/distractions", tags=["distractions"])

@sessions_router.post("", response_model=SessionOut, status_code=201)
def create_session(body: SessionCreate, db: DB, user: CurrentUser):
    s = FocusSession(user_id=user.id, **body.model_dump())
    db.add(s); db.commit(); db.refresh(s)
    return s

@sessions_router.get("", response_model=list[SessionOut])
def list_sessions(db: DB, user: CurrentUser, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    q = select(FocusSession).where(FocusSession.user_id == user.id).order_by(FocusSession.started_at.desc()).limit(limit).offset(offset)
    return db.scalars(q).all()   # pagination from day one: lists must never be unbounded

@sessions_router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: DB, user: CurrentUser):
    return svc.get_owned_session(db, user, session_id)

@sessions_router.patch("/{session_id}", response_model=SessionOut)
def update_session(session_id: int, body: SessionUpdate, db: DB, user: CurrentUser):
    s = svc.get_owned_session(db, user, session_id)
    for k, v in body.model_dump(exclude_unset=True).items():   # only fields the client actually sent
        setattr(s, k, v)
    db.commit(); db.refresh(s)
    return s

@sessions_router.post("/{session_id}/finish", response_model=SessionOut)
def finish_session(session_id: int, body: SessionFinish, db: DB, user: CurrentUser):
    return svc.finish_session(db, svc.get_owned_session(db, user, session_id), body.focus_seconds, body.completed)

@sessions_router.post("/{session_id}/distractions", response_model=DistractionOut, status_code=201)
def add_distraction(session_id: int, body: DistractionCreate, db: DB, user: CurrentUser):
    s = svc.get_owned_session(db, user, session_id)
    d = Distraction(session_id=s.id, **body.model_dump())
    db.add(d); db.commit(); db.refresh(d)
    return d

@sessions_router.get("/{session_id}/distractions", response_model=list[DistractionOut])
def list_distractions(session_id: int, db: DB, user: CurrentUser):
    return svc.get_owned_session(db, user, session_id).distractions

@distractions_router.post("/{distraction_id}/return", response_model=DistractionOut, status_code=201)
def record_return(distraction_id: int, db: DB, user: CurrentUser):
    return svc.record_return(db, svc.get_owned_distraction(db, user, distraction_id))

@distractions_router.get("", response_model=list[DistractionOut])
def list_all_distractions(db: DB, user: CurrentUser, limit: int = Query(500, ge=1, le=1000)):
    q = (select(Distraction).join(FocusSession).where(FocusSession.user_id == user.id)
         .order_by(Distraction.occurred_at.desc()).limit(limit))
    return db.scalars(q).all()
