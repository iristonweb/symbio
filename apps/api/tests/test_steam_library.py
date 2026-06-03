import pytest

from app.services import steam_library


def test_symbio_slug_for_known_appids():
    assert steam_library.symbio_slug_for_appid(221100) == "dayz"
    assert steam_library.symbio_slug_for_appid(252490) == "rust"
    assert steam_library.symbio_slug_for_appid(999999) is None


def test_normalize_owned_game():
    raw = {
        "appid": 221100,
        "name": "DayZ",
        "playtime_forever": 90,
        "playtime_2weeks": 5,
        "img_icon_url": "abc123.jpg",
    }
    out = steam_library.normalize_owned_game(raw)
    assert out["symbio_slug"] == "dayz"
    assert out["symbio_matched"] is True
    assert "221100" in (out["img_icon_url"] or "")


@pytest.mark.asyncio
async def test_fetch_owned_games_dev_mode(monkeypatch):
    monkeypatch.setattr(steam_library.settings, "STEAM_API_KEY", "")
    games, status = await steam_library.fetch_owned_games_raw("76561198000000000")
    assert status == "dev"
    assert len(games) >= 2


@pytest.mark.asyncio
async def test_build_library_payload_uses_cache():
    cached = {
        "owned_games": [{"appid": 221100, "name": "DayZ", "symbio_slug": "dayz", "symbio_matched": True}],
        "library_synced_at": "2026-01-01T00:00:00+00:00",
        "library_game_count": 1,
        "library_matched_slugs": ["dayz"],
        "library_visibility": "ok",
    }
    doc = await steam_library.build_library_payload("76561198000000000", cached_meta=cached, force_refresh=False)
    assert doc["game_count"] == 1
    assert doc["_meta_patch"] is None
