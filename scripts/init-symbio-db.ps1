# SYMBIO: start Postgres (port 5435) and run schema + seed.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "Starting Postgres (and optional infra)..."
Set-Location $Root
docker compose up -d postgres redis meilisearch minio
Start-Sleep -Seconds 6

$Api = Join-Path $Root "apps\api"
Set-Location $Api
$Python = Join-Path $Api ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
  Write-Host "Creating venv..."
  py -3.13 -m venv .venv
  & (Join-Path $Api ".venv\Scripts\pip.exe") install -U pip setuptools wheel
  & (Join-Path $Api ".venv\Scripts\pip.exe") install -r requirements.txt
}

Write-Host "init_db (tables + seed)..."
& $Python -m app.db.init_db
Write-Host "seed_db (refresh content)..."
& $Python -m app.scripts.seed_db
Write-Host "Done. Admin: admin@symbio.dev / admin123"
Write-Host "DATABASE_URL host port: 5435 (see apps/api/.env)"
