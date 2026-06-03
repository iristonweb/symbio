from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import health, auth, servers, audit, events, storage

app = FastAPI(title="SYMBIO API", version="0.1.0")

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(servers.router, prefix="/servers", tags=["servers"])
app.include_router(audit.router, prefix="/admin", tags=["admin"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(storage.router, prefix="/storage", tags=["storage"])

@app.get("/")
async def root():
    return {
        "name": "SYMBIO API",
        "version": "0.1.0",
        "health": "/health",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    # Avoid noisy 404s in dev logs
    return {}
