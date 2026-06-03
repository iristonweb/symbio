from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import (
    health,
    auth,
    servers,
    audit,
    events,
    storage,
    games,
    projects,
    articles,
    contests,
    billing,
    billing_webhooks,
    search,
    imports,
    marketplace,
    admin_users,
    ecosystem,
    cron,
)

app = FastAPI(title="SYMBIO API", version="0.2.0")

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(cron.router, prefix="/cron", tags=["cron"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(games.router, prefix="/games", tags=["games"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(servers.router, prefix="/servers", tags=["servers"])
app.include_router(articles.router, prefix="/articles", tags=["articles"])
app.include_router(contests.router, prefix="/contests", tags=["contests"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])
app.include_router(billing_webhooks.router, prefix="/billing", tags=["billing-webhooks"])
app.include_router(marketplace.router, prefix="/marketplace", tags=["marketplace"])
app.include_router(ecosystem.router, prefix="/ecosystem", tags=["ecosystem"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(imports.router, prefix="/admin/imports", tags=["admin-imports"])
app.include_router(admin_users.router, prefix="/admin", tags=["admin-users"])
app.include_router(audit.router, prefix="/admin", tags=["admin"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(storage.router, prefix="/storage", tags=["storage"])


@app.get("/")
async def root():
    return {
        "name": "SYMBIO API",
        "version": "0.2.0",
        "health": "/health",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {}
