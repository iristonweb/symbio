"""Legal metadata-only importer from public WARGM pages."""
from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.game import Game
from app.db.models.import_job import ImportItem, ImportJob, SourcePage
from app.db.models.project import Project
from app.db.models.server import Server
from app.db.models.snapshot import ServerSnapshot
from app.importers.catalog import (
    PRIORITY_GAMES,
    WARGM_CATEGORY_PATHS,
    detect_game_from_text,
    ensure_game,
    link_game_genres,
    parse_games_listing_page,
    refresh_game_server_counts,
    title_from_slug,
)
from app.importers.dedupe import (
    find_game_by_slug,
    find_project_by_source_id,
    find_server_by_host_port,
    find_server_by_source_id,
)
from app.importers.fallback_sources import enrich_server_live, extract_ip_port
from app.importers.normalizers import is_valid_host_port
from app.importers.normalizers import extract_external_id, is_valid_host_port, normalize_game_name, parse_host_port
from app.importers.source_policy import (
    check_robots_allowed,
    is_allowed_url,
    rate_limit_wait,
    USER_AGENT,
)

BASE = "https://wargm.ru"


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


def parse_projects_listing(html: str) -> list[dict]:
    projects: list[dict] = []
    seen: set[str] = set()

    for m in re.finditer(
        r'href="/project/(\d+)"[^>]*>\s*([^<\n]{3,200})',
        html,
        re.I,
    ):
        ext_id = m.group(1)
        if ext_id in seen:
            continue
        name = re.sub(r"\s+", " ", m.group(2)).strip()
        if len(name) < 3 or name.startswith("http"):
            continue
        seen.add(ext_id)
        block_start = max(0, m.start() - 400)
        block_end = min(len(html), m.end() + 1200)
        block = html[block_start:block_end]
        online_m = re.search(r"Игроки\s+(\d+)\s*/\s*(\d+)", block, re.I)
        rating_m = re.search(r"(\d+)\s+(\d+)\s+(\d+)\s*(?:<|$)", block)
        game_slug = detect_game_from_text(block) or detect_game_from_text(name) or "dayz"
        projects.append(
            {
                "source_external_id": ext_id,
                "name": name[:200],
                "online_total": int(online_m.group(1)) if online_m else 0,
                "max_players_total": int(online_m.group(2)) if online_m else 0,
                "votes": int(rating_m.group(2)) if rating_m else 0,
                "rating": min(float(rating_m.group(1)) / 100, 5.0) if rating_m else 4.0,
                "game_slugs": [game_slug],
            }
        )
    return projects


def parse_project_server_ids(html: str) -> list[str]:
    return list(dict.fromkeys(re.findall(r"/server/(\d+)", html)))


def parse_servers_listing(html: str) -> list[dict]:
    servers: list[dict] = []
    seen: set[str] = set()
    for sid, name in re.findall(
        r'href="/server/(\d+)\?[^"]*"[^>]*>\s*<img[^>]+alt="([^"]+)"',
        html,
        re.I,
    ):
        if sid in seen:
            continue
        seen.add(sid)
        game_slug = detect_game_from_text(name) or "dayz"
        servers.append(
            {
                "source_external_id": sid,
                "name": name.strip()[:200],
                "game": game_slug,
                "source_url": f"{BASE}/server/{sid}",
            }
        )
    if servers:
        return servers
    for sid in re.findall(r"/server/(\d+)", html):
        if sid in seen:
            continue
        seen.add(sid)
        servers.append(
            {
                "source_external_id": sid,
                "name": f"Server {sid}",
                "game": "dayz",
                "source_url": f"{BASE}/server/{sid}",
            }
        )
    return servers


def parse_server_page(html: str, url: str, fallback_game: str = "dayz") -> dict | None:
    title_m = re.search(r"<title>([^<•|]+)", html, re.I)
    name = (title_m.group(1).strip() if title_m else "Unknown Server")[:200]
    if "404" in name.lower() or "не найден" in name.lower():
        return None

    game = detect_game_from_text(html) or detect_game_from_text(name) or fallback_game
    game_m = re.search(r"/servers/([\w-]+)", html, re.I)
    if game_m:
        game = normalize_game_name(game_m.group(1))

    online_m = re.search(r"(\d+)\s+из\s+(\d+)\s+возможных", html, re.I)
    online, max_p = (int(online_m.group(1)), int(online_m.group(2))) if online_m else (0, 0)

    host, port = "", 0
    for candidate in re.findall(r"(\d{1,3}(?:\.\d{1,3}){3}:\d{2,5})", html):
        parsed_host, parsed_port = parse_host_port(candidate)
        if is_valid_host_port(parsed_host, parsed_port):
            host, port = parsed_host, parsed_port
            break
    if not host:
        extracted = extract_ip_port(html)
        if extracted and is_valid_host_port(*extracted):
            host, port = extracted

    game = normalize_game_name(game)
    if len(game) < 2 or not re.fullmatch(r"[\w-]+", game):
        game = normalize_game_name(fallback_game)

    map_m = re.search(r"карте\s+([\w.-]+)", html, re.I) or re.search(r"map[=:]\s*([\w.-]+)", html, re.I)
    version_m = re.search(r"версии\s+([\d.]+)", html, re.I)
    rank_m = re.search(r"(\d+)\s+позицию", html, re.I)
    uptime_m = re.search(r"uptime\s+составляет\s+(\d+)", html, re.I)

    return {
        "name": name,
        "game": normalize_game_name(game),
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
        "status": "online" if online > 0 else "offline",
    }


async def discover_games(limit: int) -> list[dict]:
    catalog: dict[str, dict] = {}

    for slug, title, category, _genres in PRIORITY_GAMES:
        catalog[slug] = {"slug": slug, "title": title, "category": category}

    for path, category in WARGM_CATEGORY_PATHS.items():
        try:
            html = await _fetch(f"{BASE}/games/{path}")
        except Exception:
            continue
        for item in parse_games_listing_page(html, category):
            catalog[item["slug"]] = item
        if len(catalog) >= limit:
            break

    return list(catalog.values())[:limit]


async def discover_server_ids(
    *,
    projects_html: str,
    project_ids: list[str],
    game_slugs: list[str],
    limit_servers: int,
    server_pages_per_game: int = 3,
) -> list[str]:
    ids: list[str] = []
    seen: set[str] = set()

    def add_many(raw_ids: list[str]) -> None:
        for sid in raw_ids:
            if sid in seen:
                continue
            seen.add(sid)
            ids.append(sid)
            if len(ids) >= limit_servers:
                return

    add_many(re.findall(r"/server/(\d+)", projects_html))
    if len(ids) >= limit_servers:
        return ids[:limit_servers]

    for pid in project_ids:
        if len(ids) >= limit_servers:
            break
        try:
            html = await _fetch(f"{BASE}/project/{pid}")
        except Exception:
            continue
        add_many(parse_project_server_ids(html))

    for slug in game_slugs:
        if len(ids) >= limit_servers:
            break
        for page in range(1, server_pages_per_game + 1):
            if len(ids) >= limit_servers:
                break
            try:
                html = await _fetch(f"{BASE}/servers/{slug}?page={page}")
            except Exception:
                break
            page_ids = re.findall(r"/server/(\d+)", html)
            if not page_ids:
                break
            before = len(ids)
            add_many(page_ids)
            if len(ids) == before:
                break

    return ids[:limit_servers]


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
        job = ImportJob(
            source="wargm",
            status="failed",
            dry_run=dry_run,
            started_by=started_by,
            error="robots.txt disallows",
        )
        db.add(job)
        await db.flush()
        return job

    job = ImportJob(source="wargm", status="running", dry_run=dry_run, started_by=started_by)
    db.add(job)
    await db.flush()

    stats = {
        "games_created": 0,
        "games_updated": 0,
        "projects_created": 0,
        "servers_created": 0,
        "servers_updated": 0,
        "skipped": 0,
    }

    try:
        discovered_games = await discover_games(limit_games)
        priority_map = {slug: (title, category, genres) for slug, title, category, genres in PRIORITY_GAMES}

        for item in discovered_games:
            slug = item["slug"]
            title = item.get("title") or title_from_slug(slug)
            category = item.get("category") or "client"
            genres = priority_map.get(slug, (title, category, []))[2]
            game, created = await ensure_game(
                db,
                slug=slug,
                title=title,
                category=category,
                source_url=f"{BASE}/game/{slug}",
                dry_run=dry_run,
            )
            if created:
                stats["games_created"] += 1
                if not dry_run and game:
                    await link_game_genres(db, game, genres)
                    db.add(
                        ImportItem(
                            job_id=job.id,
                            entity_type="game",
                            action="create",
                            source_url=f"{BASE}/game/{slug}",
                            payload={"slug": slug, "title": title, "category": category},
                        )
                    )
            else:
                stats["games_updated"] += 1

        await db.flush()

        projects_html = await _fetch(f"{BASE}/projects")
        if not dry_run:
            source_url = f"{BASE}/projects"
            content_hash = _hash_content(projects_html)
            existing_sp = (
                await db.execute(select(SourcePage).where(SourcePage.url == source_url))
            ).scalar_one_or_none()
            if existing_sp:
                existing_sp.content_hash = content_hash
                existing_sp.fetched_at = datetime.now(timezone.utc)
            else:
                db.add(
                    SourcePage(
                        url=source_url,
                        content_hash=content_hash,
                        robots_allowed=True,
                        fetched_at=datetime.now(timezone.utc),
                    )
                )

        parsed_projects = parse_projects_listing(projects_html)[:limit_projects]
        project_ids = [p["source_external_id"] for p in parsed_projects]

        for pdata in parsed_projects:
            ext_id = pdata["source_external_id"]
            existing = await find_project_by_source_id(db, ext_id)
            if existing:
                stats["skipped"] += 1
                continue
            if dry_run:
                stats["projects_created"] += 1
                continue
            p = Project(
                slug=f"project-{ext_id}",
                name=pdata["name"],
                description="Community project — metadata imported from public WARGM listing.",
                game_slugs=pdata.get("game_slugs", ["dayz"]),
                rating=pdata.get("rating", 0),
                votes=pdata.get("votes", 0),
                online_total=pdata.get("online_total", 0),
                max_players_total=pdata.get("max_players_total", 0),
                source_url=f"{BASE}/project/{ext_id}",
                source_external_id=ext_id,
                source_meta={"metadata_only": True, "imported_from": "wargm"},
            )
            db.add(p)
            stats["projects_created"] += 1
            db.add(
                ImportItem(
                    job_id=job.id,
                    entity_type="project",
                    action="create",
                    source_url=f"{BASE}/project/{ext_id}",
                    payload={"name": pdata["name"], "game_slugs": pdata.get("game_slugs", [])},
                )
            )

        game_slugs = [g["slug"] for g in discovered_games]
        if "dayz" not in game_slugs:
            game_slugs.insert(0, "dayz")
        server_ids = await discover_server_ids(
            projects_html=projects_html,
            project_ids=project_ids[: min(len(project_ids), 20)],
            game_slugs=game_slugs[: min(len(game_slugs), 15)],
            limit_servers=limit_servers,
        )

        for sid in server_ids:
            url = f"{BASE}/server/{sid}"
            if not is_allowed_url(url):
                continue
            try:
                html = await _fetch(url)
            except Exception:
                stats["skipped"] += 1
                continue

            listing_hint = next((x for x in parse_servers_listing(projects_html) if x["source_external_id"] == sid), None)
            fallback_game = listing_hint["game"] if listing_hint else "dayz"
            parsed = parse_server_page(html, url, fallback_game=fallback_game)
            if not parsed:
                stats["skipped"] += 1
                continue

            if listing_hint and listing_hint.get("name"):
                parsed["name"] = listing_hint["name"]

            if not parsed.get("host") or not parsed.get("port"):
                live = await enrich_server_live(parsed.get("host") or "", parsed.get("port") or 0, parsed["game"])
                if live:
                    parsed["online"] = live.get("online", parsed["online"])
                    parsed["max_players"] = live.get("max_players", parsed["max_players"])
                    parsed["map"] = live.get("map") or parsed.get("map")
                    parsed["version"] = live.get("version") or parsed.get("version")
                    parsed["source_meta_extra"] = {"live_source": live.get("source")}
                if not parsed.get("host") or not parsed.get("port"):
                    stats["skipped"] += 1
                    continue

            if not is_valid_host_port(parsed["host"], parsed["port"]):
                stats["skipped"] += 1
                continue

            existing = await find_server_by_source_id(db, parsed["source_external_id"] or "")
            if not existing and parsed.get("host") and parsed.get("port"):
                existing = await find_server_by_host_port(db, parsed["host"], parsed["port"])
            if existing:
                stats["skipped"] += 1
                continue

            if dry_run:
                stats["servers_created"] += 1
                continue

            await ensure_game(
                db,
                slug=parsed["game"],
                title=title_from_slug(parsed["game"]),
                category="client",
                source_url=f"{BASE}/servers/{parsed['game']}",
                dry_run=False,
            )
            game = await find_game_by_slug(db, parsed["game"]) or await find_game_by_slug(db, "dayz")

            source_meta = {"metadata_only": True, "imported_from": "wargm"}
            if parsed.get("source_meta_extra"):
                source_meta.update(parsed["source_meta_extra"])

            s = Server(
                game_id=game.id if game else None,
                game=parsed["game"],
                name=parsed["name"],
                slug=f"server-{parsed['source_external_id']}",
                host=parsed["host"],
                port=parsed["port"],
                join_url=f"{parsed['host']}:{parsed['port']}",
                source_url=url,
                source_external_id=parsed["source_external_id"],
                source_meta=source_meta,
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
                    payload={"name": parsed["name"], "host": parsed["host"], "game": parsed["game"]},
                )
            )

        if not dry_run:
            stats["games_updated"] += await refresh_game_server_counts(db)

        job.status = "completed"
        job.stats = stats
        job.finished_at = datetime.now(timezone.utc)
    except Exception as e:
        job.status = "failed"
        job.error = str(e)
        job.finished_at = datetime.now(timezone.utc)

    return job
