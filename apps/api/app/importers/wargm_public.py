"""Legal metadata-only importer from public WARGM pages."""
import hashlib
import re
from datetime import datetime, timezone
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.game import Game
from app.db.models.project import Project
from app.db.models.server import Server
from app.db.models.snapshot import ServerSnapshot
from app.db.models.import_job import ImportJob, ImportItem, SourcePage
from app.importers.source_policy import (
    ALLOWED_DOMAINS,
    USER_AGENT,
    is_allowed_url,
    rate_limit_wait,
    check_robots_allowed,
)
from app.importers.normalizers import slugify, normalize_game_name, parse_host_port, extract_external_id
from app.importers.dedupe import (
    find_server_by_host_port,
    find_server_by_source_id,
    find_project_by_source_id,
    find_game_by_slug,
)

BASE = "https://wargm.ru"
KNOWN_GAMES = [
    ("dayz", "DayZ", "client"),
    ("rust", "Rust", "client"),
    ("arma-3", "ARMA 3", "client"),
    ("minecraft", "Minecraft", "client"),
    ("scum", "SCUM", "client"),
    ("7-days-to-die", "7 Days to Die", "client"),
    ("conan-exiles", "Conan Exiles", "client"),
    ("ark-survival-evolved", "ARK: Survival Evolved", "client"),
    ("squad", "Squad", "client"),
    ("project-zomboid", "Project Zomboid", "client"),
]


def _hash_content(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


async def _fetch(url: str) -> str:
    if not is_allowed_url(url):
        raise ValueError(f"URL not in allowlist: {url}")
    rate_limit_wait("wargm.ru")
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        r = await client.get(url, headers={"User-Agent": USER_AGENT})
        r.raise_for_status()
        return r.text


def _parse_projects_page(html: str) -> list[dict]:
    projects = []
    blocks = re.split(r"Смотреть все сервера проекта", html)
    for block in blocks[:80]:
        name_m = re.search(r"##\s*([^\n]+)", block) or re.search(r"title=\"([^\"]+)\"", block)
        if not name_m:
            continue
        name = name_m.group(1).strip()[:200]
        if len(name) < 3:
            continue
        online_m = re.search(r"Игроки\s+(\d+)\s*/\s*(\d+)", block)
        rating_m = re.search(r"(\d+)\s+(\d+)\s+(\d+)\s*$", block, re.M)
        online, max_p = (int(online_m.group(1)), int(online_m.group(2))) if online_m else (0, 0)
        votes = int(rating_m.group(2)) if rating_m else 0
        rating = float(rating_m.group(1)) / 100 if rating_m else 0.0
        projects.append(
            {
                "name": name,
                "online_total": online,
                "max_players_total": max_p,
                "votes": votes,
                "rating": min(rating, 5.0) if rating else 4.0,
                "game_slugs": ["dayz"],
            }
        )
    return projects[:50]


def _parse_server_page(html: str, url: str) -> dict | None:
    title_m = re.search(r"<title>([^<•]+)", html, re.I)
    name = (title_m.group(1).strip() if title_m else "Unknown Server")[:200]
    game_m = re.search(r"игры\s+(\w+)", html, re.I) or re.search(r"game[_\s]?name[\"']?\s*[:=]\s*[\"']?(\w+)", html, re.I)
    game = normalize_game_name(game_m.group(1) if game_m else "dayz")
    online_m = re.search(r"(\d+)\s+из\s+(\d+)\s+возможных", html, re.I)
    online, max_p = (int(online_m.group(1)), int(online_m.group(2))) if online_m else (0, 0)
    addr_m = re.search(r"([\d.]+:\d+)", html)
    host, port = parse_host_port(addr_m.group(1)) if addr_m else ("", 0)
    map_m = re.search(r"карте\s+(\w+)", html, re.I)
    version_m = re.search(r"версии\s+([\d.]+)", html, re.I)
    rank_m = re.search(r"(\d+)\s+позицию", html, re.I)
    uptime_m = re.search(r"uptime\s+составляет\s+(\d+)", html, re.I)
    return {
        "name": name,
        "game": game,
        "host": host,
        "port": port,
        "online": online,
        "max_players": max_p,
        "map": map_m.group(1) if map_m else None,
        "version": version_m.group(1) if version_m else None,
        "rank": int(rank_m.group(1)) if rank_m else None,
        "uptime_percent": float(uptime_m.group(1)) if uptime_m else None,
        "source_url": url,
        "source_external_id": extract_external_id(url),
        "status": "online" if online > 0 or max_p > 0 else "offline",
    }


async def run_import(
    db: AsyncSession,
    *,
    dry_run: bool = True,
    started_by: UUID | None = None,
    limit_games: int = 20,
    limit_projects: int = 50,
    limit_servers: int = 100,
) -> ImportJob:
    if not await check_robots_allowed(BASE):
        job = ImportJob(source="wargm", status="failed", dry_run=dry_run, started_by=started_by, error="robots.txt disallows")
        db.add(job)
        await db.flush()
        return job

    job = ImportJob(source="wargm", status="running", dry_run=dry_run, started_by=started_by)
    db.add(job)
    await db.flush()

    stats = {"games_created": 0, "games_updated": 0, "projects_created": 0, "servers_created": 0, "skipped": 0}

    try:
        for slug, title, category in KNOWN_GAMES[:limit_games]:
            existing = await find_game_by_slug(db, slug)
            if existing:
                stats["games_updated"] += 1
                continue
            if not dry_run:
                db.add(
                    Game(
                        slug=slug,
                        title=title,
                        category=category,
                        platforms=["pc"],
                        short_description=f"{title} — community servers on SYMBIO.",
                        source_url=f"{BASE}/games",
                        source_meta={"imported_from": "wargm", "metadata_only": True},
                    )
                )
                stats["games_created"] += 1
                db.add(
                    ImportItem(
                        job_id=job.id,
                        entity_type="game",
                        action="create",
                        source_url=f"{BASE}/games",
                        payload={"slug": slug, "title": title},
                    )
                )
            else:
                stats["games_created"] += 1

        await db.flush()

        projects_html = await _fetch(f"{BASE}/projects")
        sp = SourcePage(
            url=f"{BASE}/projects",
            content_hash=_hash_content(projects_html),
            robots_allowed=True,
            fetched_at=datetime.now(timezone.utc),
        )
        if not dry_run:
            db.add(sp)

        for pdata in _parse_projects_page(projects_html)[:limit_projects]:
            ext_id = slugify(pdata["name"])
            existing = await find_project_by_source_id(db, ext_id)
            if existing:
                stats["skipped"] += 1
                continue
            if dry_run:
                stats["projects_created"] += 1
                continue
            p = Project(
                slug=ext_id,
                name=pdata["name"],
                description=f"Community project — metadata imported from public listing.",
                game_slugs=pdata.get("game_slugs", ["dayz"]),
                rating=pdata.get("rating", 0),
                votes=pdata.get("votes", 0),
                online_total=pdata.get("online_total", 0),
                max_players_total=pdata.get("max_players_total", 0),
                source_url=f"{BASE}/projects",
                source_external_id=ext_id,
                source_meta={"metadata_only": True},
            )
            db.add(p)
            stats["projects_created"] += 1
            db.add(
                ImportItem(
                    job_id=job.id,
                    entity_type="project",
                    action="create",
                    source_url=f"{BASE}/projects",
                    payload={"name": pdata["name"]},
                )
            )

        server_ids = list(range(77000, 77000 + min(limit_servers, 30)))
        for sid in server_ids:
            url = f"{BASE}/server/{sid}"
            if not is_allowed_url(url):
                continue
            try:
                html = await _fetch(url)
            except Exception:
                stats["skipped"] += 1
                continue
            parsed = _parse_server_page(html, url)
            if not parsed or not parsed.get("host"):
                stats["skipped"] += 1
                continue
            existing = await find_server_by_source_id(db, parsed["source_external_id"] or "")
            if not existing:
                existing = await find_server_by_host_port(db, parsed["host"], parsed["port"])
            if existing:
                stats["skipped"] += 1
                continue
            if dry_run:
                stats["servers_created"] += 1
                continue
            game = await find_game_by_slug(db, parsed["game"]) or await find_game_by_slug(db, "dayz")
            s = Server(
                game_id=game.id if game else None,
                game=parsed["game"],
                name=parsed["name"],
                slug=slugify(parsed["name"]),
                host=parsed["host"],
                port=parsed["port"],
                join_url=f"{parsed['host']}:{parsed['port']}",
                source_url=url,
                source_external_id=parsed["source_external_id"],
                source_meta={"metadata_only": True},
                tags={},
            )
            db.add(s)
            await db.flush()
            db.add(
                ServerSnapshot(
                    server_id=s.id,
                    online=parsed["online"],
                    max_players=parsed["max_players"],
                    map=parsed.get("map"),
                    version=parsed.get("version"),
                    status=parsed["status"],
                    rank=parsed.get("rank"),
                    uptime_percent=parsed.get("uptime_percent"),
                )
            )
            stats["servers_created"] += 1
            db.add(
                ImportItem(
                    job_id=job.id,
                    entity_type="server",
                    entity_id=s.id,
                    action="create",
                    source_url=url,
                    payload={"name": parsed["name"], "host": parsed["host"]},
                )
            )

        job.status = "completed"
        job.stats = stats
        job.finished_at = datetime.now(timezone.utc)
    except Exception as e:
        job.status = "failed"
        job.error = str(e)
        job.finished_at = datetime.now(timezone.utc)

    return job
