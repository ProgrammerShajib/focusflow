from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.core.config import settings

app = FastAPI(title="FocusFlow API", version="1.0.0",
              description="Attention-training backend. Interactive docs: /docs")
# CORS: lets the React app (a different origin) call this API from the browser.
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
# Versioned prefix: a future breaking change becomes /api/v2 while v1 keeps working.
app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}   # used by hosting platforms to check the app is alive
