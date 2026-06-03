import pytest

from app.importers.catalog import detect_game_from_text, parse_games_listing_page
from app.importers.fallback_sources import extract_ip_port, parse_a2s_info_response
from app.importers.normalizers import slugify, parse_host_port, extract_external_id
from app.importers.source_policy import is_allowed_url, metadata_only_fields
from app.importers.wargm_public import parse_projects_listing, parse_server_page, parse_servers_listing


def test_slugify():
    assert slugify("Hello World!") == "hello-world"


def test_parse_host_port():
    assert parse_host_port("81.25.49.133:2302") == ("81.25.49.133", 2302)


def test_extract_external_id():
    assert extract_external_id("https://wargm.ru/server/77427") == "77427"


def test_is_allowed_url():
    assert is_allowed_url("https://wargm.ru/projects") is True
    assert is_allowed_url("https://evil.com/x") is False


def test_metadata_only_fields():
    assert "name" in metadata_only_fields()
    assert "body" not in metadata_only_fields()


def test_detect_game_from_text():
    assert detect_game_from_text("TWINKLE Play DayZ PVE") == "dayz"
    assert detect_game_from_text("KIRAMAN RUST MAX5") == "rust"


def test_parse_games_listing_page():
    html = """
    <a href="/game/squad"><h3 class='m-0'>Squad</h3></a>
    <a href="/game/rust"><h3 class='m-0'>Rust</h3></a>
    """
    games = parse_games_listing_page(html, "client")
    assert len(games) == 2
    assert games[0]["slug"] == "squad"
    assert games[0]["category"] == "client"


def test_parse_projects_listing():
    html = """
    href="/project/3485">TWINKLE Play</a>
    Игроки 250 / 640
    637 814 17
    Project TWINKLE Play PVE DayZ
    """
    projects = parse_projects_listing(html)
    assert projects
    assert projects[0]["source_external_id"] == "3485"
    assert projects[0]["game_slugs"] == ["dayz"]


def test_parse_servers_listing():
    html = """
    href="/server/68242?click=intrested"><img alt="SAMOPAL PVE DayZ">
    """
    servers = parse_servers_listing(html)
    assert servers[0]["source_external_id"] == "68242"
    assert servers[0]["game"] == "dayz"


def test_parse_server_page():
    html = """
    <title>SAMOPAL PVE 2 - STALKER | Cars · DayZ сервер</title>
    13 из 45 возможных
    80.242.59.56:2402
    карте chernarusplus
    версии 1.29.1
    """
    parsed = parse_server_page(html, "https://wargm.ru/server/68242")
    assert parsed is not None
    assert parsed["host"] == "80.242.59.56"
    assert parsed["port"] == 2402
    assert parsed["game"] == "dayz"
    assert parsed["online"] == 13


def test_extract_ip_port():
    assert extract_ip_port("connect 80.242.59.56:2402 now") == ("80.242.59.56", 2402)


def test_parse_a2s_info_response_minimal():
    import struct

    payload = (
        b"\xFF\xFF\xFF\xFFI\x00"
        b"Test Server\x00"
        b"de_dust2\x00"
        b"cstrike\x00"
        b"Counter-Strike\x00"
        + struct.pack("<H", 730)
        + bytes([5, 32])
    )
    parsed = parse_a2s_info_response(payload)
    assert parsed is not None
    assert parsed["name"] == "Test Server"
    assert parsed["online"] == 5
    assert parsed["max_players"] == 32
