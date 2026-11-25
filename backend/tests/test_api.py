import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base, get_db
from app.main import app
import app.models  # noqa: F401

@pytest.fixture()
def client():
    """Each test gets a fresh in-memory database and a logged-in user."""
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Local = sessionmaker(bind=engine, autoflush=False)
    def override():
        db = Local()
        try: yield db
        finally: db.close()
    app.dependency_overrides[get_db] = override
    with TestClient(app) as c:
        c.post("/api/v1/auth/register", json={"email": "a@b.com", "password": "password123"})
        tok = c.post("/api/v1/auth/login", data={"username": "a@b.com", "password": "password123"}).json()["access_token"]
        c.headers["Authorization"] = f"Bearer {tok}"
        yield c
    app.dependency_overrides.clear()

def test_requires_auth():
    assert TestClient(app).get("/api/v1/sessions").status_code == 401

def test_full_focus_flow(client):
    s = client.post("/api/v1/sessions", json={"task_title": "Read", "category": "Reading", "planned_duration": 25}).json()
    d = client.post(f"/api/v1/sessions/{s['id']}/distractions", json={"category": "Future thoughts"}).json()
    assert client.post(f"/api/v1/distractions/{d['id']}/return").status_code == 201
    assert client.post(f"/api/v1/distractions/{d['id']}/return").status_code == 409   # only one return each
    assert client.post(f"/api/v1/sessions/{s['id']}/finish", json={"focus_seconds": 600, "completed": True}).json()["status"] == "completed"
    stats = client.get("/api/v1/analytics/summary").json()
    assert stats["total_focus_seconds"] == 600 and stats["successful_returns"] == 1 and stats["current_streak"] == 1

def test_validation(client):
    assert client.post("/api/v1/sessions", json={"task_title": "x", "category": "Nope", "planned_duration": 25}).status_code == 422
