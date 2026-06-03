"""Steam owned games (GetOwnedGames) and SYMBIO catalog matching."""

from __future__ import annotations

from datetime import datetime, timezone

import httpx

from app.core.config import settings
from app.services.steam_app_map import STEAM_APP_TO_SYMBIO_SLUG, slug_for_appid

DEV_OWNED_GAMES = [
    {"appid": 221100, "name": "DayZ", "playtime_forever": 1200, "playtime_2weeks": 45, "img_icon_url": ""},
    {"appid": 252490, "name": "Rust", "playtime_forever": 800, "playtime_2weeks": 12, "img_icon_url": ""},
    {"appid": 107410, "name": "ARMA 3", "playtime_forever": 300, "playtime_2weeks": 0, "img_icon_url": ""},
]


def symbio_slug_for_appid(appid: int) -> str | None:
    return slug_for_appid(appid)


def steam_icon_url(appid: int, icon_hash: str) -> str | None:
    if not icon_hash:
        return None
    return f"https://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{icon_hash}.jpg"


async def fetch_owned_games_raw(steam_id: str) -> tuple[list[dict], str]:
    """
    Returns (games, status) where status is ok | private | unavailable | dev.
    """
    if not settings.STEAM_API_KEY:
        return [dict(g) for g in DEV_OWNED_GAMES], "dev"

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/",
            params={
                "key": settings.STEAM_API_KEY,
                "steamid": steam_id,
                "include_appinfo": 1,
                "include_played_free_games": 1,
                "format": "json",
            },
        )
        if res.status_code != 200:
            return [], "unavailable"
        payload = res.json()
    response = payload.get("response") or {}
    games = response.get("games") or []
    if not games and response.get("game_count", 0) == 0:
        # Empty can mean private library or truly empty.
        return [], "private"
    return games, "ok"


def _normalize_with_slug(raw: dict, slug: str | None) -> dict:
    appid = int(raw.get("appid", 0))
    icon = raw.get("img_icon_url") or ""
    return {
        "appid": appid,
        "name": raw.get("name") or f"App {appid}",
        "playtime_forever": int(raw.get("playtime_forever") or 0),
        "playtime_2weeks": int(raw.get("playtime_2weeks") or 0),
        "img_icon_url": steam_icon_url(appid, icon),
        "symbio_slug": slug,
        "symbio_matched": slug is not None,
    }


def normalize_owned_game(raw: dict) -> dict:
    appid = int(raw.get("appid", 0))
    return _normalize_with_slug(raw, symbio_slug_for_appid(appid))


async def user_owns_symbio_game(identity_meta: dict | None, game_slug: str) -> bool:
    if not identity_meta or not game_slug:
        return False
    slugs = identity_meta.get("library_matched_slugs") or []
    if game_slug in slugs:
        return True
    for g in identity_meta.get("owned_games") or []:
        if g.get("symbio_slug") == game_slug:
            return True
    return False


async def fetch_recommended_servers(db, matched_slugs: list[str], *, limit: int = 8) -> list[dict]:
    from app.db.crud.servers import list_servers

    if not matched_slugs:
        return []
    collected: list[dict] = []
    per_game = max(2, limit // max(1, len(matched_slugs)))
    for slug in matched_slugs[:6]:
        batch = await list_servers(db, game=slug, sort="online", fresh_minutes=10080, limit=per_game)
        collected.extend(batch)
    seen: set[str] = set()
    unique: list[dict] = []
    for item in sorted(collected, key=lambda s: s.get("snapshot", {}).get("online", 0), reverse=True):
        sid = item.get("id")
        if sid and sid not in seen:
            seen.add(sid)
            unique.append(item)
        if len(unique) >= limit:
            break
    return unique


async def build_library_payload(
    steam_id: str,
    *,
    cached_meta: dict | None = None,
    force_refresh: bool = False,
    db=None,
) -> dict:
    """Fetch from Steam (or cache) and return API-ready library document."""
    if not force_refresh and cached_meta:
        cached_games = cached_meta.get("owned_games")
        synced_at = cached_meta.get("library_synced_at")
        if cached_games is not None and synced_at:
            return _library_from_cache(steam_id, cached_meta)

    raw_games, status = await fetch_owned_games_raw(steam_id)
    games: list[dict] = []
    matched_slugs_set: set[str] = set()
    if db is not None:
        from app.db.crud.steam_games import resolve_symbio_slug_for_appid

        for raw in raw_games:
            appid = int(raw.get("appid", 0))
            slug = await resolve_symbio_slug_for_appid(db, appid)
            games.append(_normalize_with_slug(raw, slug))
            if slug:
                matched_slugs_set.add(slug)
    else:
        games = [normalize_owned_game(g) for g in raw_games]
        matched_slugs_set = {g["symbio_slug"] for g in games if g.get("symbio_slug")}
    matched_slugs = sorted(matched_slugs_set)

    return {
        "steam_id": steam_id,
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "visibility": status,
        "game_count": len(games),
        "matched_count": len(matched_slugs),
        "matched_slugs": matched_slugs,
        "games": games,
        "_meta_patch": {
            "owned_games": games,
            "library_synced_at": datetime.now(timezone.utc).isoformat(),
            "library_game_count": len(games),
            "library_matched_slugs": matched_slugs,
            "library_visibility": status,
        },
    }


def _library_from_cache(steam_id: str, meta: dict) -> dict:
    games = meta.get("owned_games") or []
    matched_slugs = meta.get("library_matched_slugs") or sorted(
        {g.get("symbio_slug") for g in games if g.get("symbio_slug")}
    )
    return {
        "steam_id": steam_id,
        "synced_at": meta.get("library_synced_at"),
        "visibility": meta.get("library_visibility") or "cached",
        "game_count": meta.get("library_game_count", len(games)),
        "matched_count": len(matched_slugs),
        "matched_slugs": matched_slugs,
        "games": games,
        "_meta_patch": None,
    }
