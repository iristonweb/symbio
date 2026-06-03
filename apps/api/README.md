# SYMBIO API (FastAPI) — Sprint 0

Features included:
- Health check
- JWT auth (register/login)
- RBAC (admin role)
- Audit log
- Events tracking
- Servers listing with snapshot freshness gate
- Presigned URLs for uploads/downloads (MinIO/S3-compatible)

See root README for run steps.


## Endpoints

- `GET /` — basic info (links to health/docs)
- `GET /health` — health check
- `GET /docs` — Swagger UI
- `GET /openapi.json` — OpenAPI schema
