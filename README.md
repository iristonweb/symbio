# SYMBIO — Sprint 0 (Scaffold)

This archive contains a **working Sprint 0 foundation** based on **SYMBIO Master Brief v1.2 (FINAL PACK)**:
- Infra: Postgres + Redis + Meilisearch + MinIO (S3-compatible)
- API: FastAPI + async SQLAlchemy + JWT auth + RBAC + Audit + Events + Servers listing (freshness gate)
- Web: Next.js (App Router) shell with Discover/Expert toggle + Servers page + Admin/Audit page

## 0) Requirements
- Docker Desktop
- Python 3.11+
- Node.js 18+

## 1) Start infrastructure
From repo root:
```bash
docker compose up -d
```

Services:
- Postgres: `localhost:5435` (db `symbio`, user/pass `symbio`; host port 5435 avoids clash with other local Postgres on 5432)
- Redis: `localhost:6379`
- Meilisearch: `http://localhost:7700`
- MinIO console: `http://localhost:9011` (minioadmin/minioadmin)
- MinIO S3 endpoint: `http://localhost:9010`

## 2) Run API (FastAPI)
```bash
cd apps/api
python -m venv .venv
# Windows:
# .venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

# copy env
copy ..\..\.env.example .env  # Windows PowerShell: Copy-Item ..\..\.env.example .env
# or just set env vars manually

python -m app.db.init_db
python -m app.scripts.create_admin --email admin@symbio.dev --password admin123

uvicorn app.main:app --reload --port 8000
```

API endpoints:
- `GET /health`
- `POST /auth/register` / `POST /auth/login`
- `GET /games` / `GET /games/{slug}`
- `GET /projects` / `GET /projects/{slug}` / `POST /projects`
- `GET /servers` / `GET /servers/{id}` / `POST /servers` / `POST /servers/claim`
- `GET /articles` / `GET /articles/{slug}`
- `GET /contests` / `POST /contests/{id}/join`
- `GET /billing/plans` / `GET /billing/wallet` / `POST /billing/checkout` / `POST /billing/promotions`
- `GET /search?q=...&index=servers|games|projects|articles`
- `POST /admin/imports/wargm/dry-run` / `POST /admin/imports/wargm/run` (admin)
- `GET /admin/audit` (admin only)
- `POST /events/track`
- `GET /storage/presign-upload` / `GET /storage/presign-download`

Web routes: `/games`, `/projects`, `/servers`, `/news`, `/guides`, `/promocodes`, `/contests`, `/studio`, `/billing`, `/admin/imports`

## 3) Run Web (Next.js)
In a new terminal:
```bash
cd apps/web
npm install
# copy env
copy ..\..\.env.example .env.local  # PowerShell: Copy-Item ..\..\.env.example .env.local
npm run dev
```

Open:
- Web: `http://localhost:3000`
- Servers: `http://localhost:3000/servers`
- Admin/Audit: `http://localhost:3000/admin/audit` (paste admin token)

## Launch features (Sprint 1+)
- Extended auth: email verification, Google/Steam OAuth (dev mode without keys), SYMBIO nickname generation
- Roles: `user`, `creator`, `site_owner`, `moderator`, `admin` with capability-based UI
- Marketplace: products, cart, checkout (mock), library, moderation API
- Billing: audience-specific plans (user / site_owner / creator) in RUB, payment provider adapter (mock → YooKassa/CloudPayments)
- Ecosystem radar: live API `/ecosystem/radar` on home page
- Alembic scaffold in `apps/api/alembic/` (fresh DB: `python -m app.db.init_db`)

### New API routes
- `GET /auth/me`, `PATCH /auth/me`, email verify, Google/Steam OAuth
- `GET /marketplace/products`, cart, checkout, library
- `GET /ecosystem/radar`
- `GET /billing/plans?audience=user|site_owner|creator`
- `GET /admin/users`, `PATCH /admin/users/{id}/roles`

## Notes
- For schema changes on an existing DB, recreate Postgres volume or run migrations after backup.
- Payment keys: set `YUKASSA_*` or `CLOUDPAYMENTS_*` and `PAYMENT_PROVIDER` when going live.


## Security note (Next.js)
If you see an npm warning about `next@14.2.5` vulnerabilities, upgrade the web app to the patched version:
```bash
npm --workspace apps/web install next@14.2.35
```
(See Next.js security advisory for Dec 11, 2025.)

## Docker troubleshooting

### MinIO init image tag not found
If you see `minio/mc:RELEASE.... not found`, use the patched compose which pins `minio/mc:latest` (or a known good release tag).


---
## Windows / Python note (important)

If you're on **Python 3.13** and `pip install -r apps/api/requirements.txt` fails with a message about **Rust / Cargo not on PATH**, it usually means one of the pinned dependencies doesn't have prebuilt wheels for your Python version.

This repo pins FastAPI/Pydantic versions that support **Python 3.13**. If you still hit that error:
1) Make sure you're using this patched version of the repo.
2) Upgrade pip tooling:
   - `python -m pip install -U pip setuptools wheel`
3) Reinstall deps:
   - `pip install -r apps/api/requirements.txt`

Alternative: use Python 3.12 (`py -3.12`) for the API venv.

## Windows note (Watchpack EINVAL)
On some Windows setups you may see Watchpack `EINVAL` warnings referencing system files like `C:\pagefile.sys`.
They are usually harmless. If you want to silence them, run the web app from a non-root folder (like `C:\Projects\...`),
and ensure you start Next from `apps\web` (or via `npm run dev` which does that).

### API (FastAPI) — Windows-safe run
Always run uvicorn via `python -m uvicorn` so you use the active venv interpreter.

```bat
cd apps\api
py -3.13 -m venv .venv
.venv\Scripts\activate
python -m pip install -U pip setuptools wheel
copy ..\..\.env.example .env
# Tip (Windows): if DB connects unreliably, set DATABASE_URL host to 127.0.0.1 (not localhost)
python -m pip install -r requirements.txt
python -c "import sqlalchemy, asyncpg; print('sqlalchemy', sqlalchemy.__version__)"
python -m app.db.init_db
python -m app.scripts.create_admin --email admin@symbio.dev --password admin123
python -m uvicorn app.main:app --reload --port 8000
```
