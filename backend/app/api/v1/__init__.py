"""Router registry. To add a feature: write its router file, include it here. Nothing else changes."""
from fastapi import APIRouter
from app.api.v1 import analytics, auth, focus, reflections

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(focus.sessions_router)
api_router.include_router(focus.distractions_router)
api_router.include_router(analytics.router)
api_router.include_router(reflections.reflections_router)
api_router.include_router(reflections.goals_router)
