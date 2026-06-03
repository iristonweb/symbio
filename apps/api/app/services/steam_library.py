"""Steam owned games (GetOwnedGames) and SYMBIO catalog matching."""

from __future__ import annotations

from datetime import datetime, timezone

import httpx

from app.core.config import settings

# Steam appid → SYMBIO game slug (extend as catalog grows).
STEAM_APP_TO_SYMBIO_SLUG: dict[int, str] = {
    221100: "dayz",
    252490: "rust",
    107410: "arma-3",
    346110: "ark-survival-evolved",
    440: "team-fortress-2",
    730: "counter-strike-2",
    1623730: "palworld",
    892970: "valheim",
    108600: "project-zomboid",
    4000: "garrys-mod",
    244850: "space-engineers",
    105600: "terraria",
    251570: "7-days-to-die",
    242760: "the-forest",
    1326470: "sons-of-the-forest",
    393380: "squad",
    686810: "hell-let-loose",
    581320: "insurgency-sandstorm",
    513710: "scum",
    440900: "conan-exiles",
    304930: "unturned",
}

DEV_OWNED_GAMES = [
    {"appid": 221100, "name": "DayZ", "playtime_forever": 1200, "playtime_2weeks": 45, "img_icon_url": ""},
    {"appid": 252490, "name": "Rust", "playtime_forever": 800, "playtime_2weeks": 12, "img_icon_url": ""},
    {"appid": 107410, "name": "ARMA 3", "playtime_forever": 300, "playtime_2weeks": 0, "img_icon_url": ""},
]


def symbio_slug_for_appid(appid: int) -> str | None:
    return STEAM_APP_TO_SYMBIO_SLUG.get(appid)


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


def normalize_owned_game(raw: dict) -> dict:
    appid = int(raw.get("appid", 0))
    slug = symbio_slug_for_appid(appid)
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


async def build_library_payload(
    steam_id: str,
    *,
    cached_meta: dict | None = None,
    force_refresh: bool = False,
) -> dict:
    """Fetch from Steam (or cache) and return API-ready library document."""
    if not force_refresh and cached_meta:
        cached_games = cached_meta.get("owned_games")
        synced_at = cached_meta.get("library_synced_at")
        if cached_games is not None and synced_at:
            return _library_from_cache(steam_id, cached_meta)

    raw_games, status = await fetch_owned_games_raw(steam_id)
    games = [normalize_owned_game(g) for g in raw_games]
    matched_slugs = sorted({g["symbio_slug"] for g in games if g.get("symbio_slug")})

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
