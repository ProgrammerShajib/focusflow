"""Pydantic schemas = the API's contract. They validate input and shape output.
Models (database) and schemas (API) are separate on purpose: you can change
one without breaking the other, and password_hash can never leak in a response."""
from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field

Category = Literal["Coding", "English", "Reading", "Study", "Other"]
DistractionKind = Literal["News & social media", "Imaginary conversations", "Future thoughts",
                          "Past memories", "Random thoughts", "Other"]
Intensity = Literal["Easy", "Medium", "Hard"]

class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)   # allow reading from SQLAlchemy objects

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)  # bcrypt limit is 72 bytes
class UserOut(ORM):
    id: int
    email: str
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class SessionCreate(BaseModel):
    task_title: str = Field(min_length=1, max_length=200)
    category: Category
    planned_duration: int = Field(ge=1, le=180)
class SessionUpdate(BaseModel):
    task_title: str | None = Field(None, min_length=1, max_length=200)
    category: Category | None = None
class SessionFinish(BaseModel):
    focus_seconds: int = Field(ge=0)
    completed: bool
class SessionOut(ORM):
    id: int
    task_title: str
    category: str
    planned_duration: int
    focus_seconds: int
    started_at: datetime
    ended_at: datetime | None
    status: str

class DistractionCreate(BaseModel):
    category: DistractionKind
    intensity: Intensity = "Easy"
    note: str = Field("", max_length=500)
class ReturnOut(ORM):
    returned_at: datetime
    recovery_duration_seconds: int
class DistractionOut(ORM):
    id: int
    session_id: int
    category: str
    intensity: str
    note: str
    occurred_at: datetime
    return_event: ReturnOut | None

class ReflectionIn(BaseModel):
    reflection_date: date
    distractions_summary: str = Field("", max_length=2000)
    successful_strategies: str = Field("", max_length=2000)
    achievements: str = Field("", max_length=2000)
    improvements: str = Field("", max_length=2000)
class ReflectionOut(ReflectionIn, ORM):
    id: int

class GoalIn(BaseModel):
    goal_date: date
    target_focus_minutes: int = Field(ge=0, le=1440)
    target_sessions: int = Field(ge=0, le=100)
    completed: bool = False
class GoalOut(GoalIn, ORM):
    id: int
