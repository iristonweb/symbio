"""Authoritative live metadata fallbacks when WARGM pages lack host/port or online."""
from __future__ import annotations

import asyncio
import re
import socket
import struct

import httpx

from app.importers.normalizers import is_valid_host_port

A2S_INFO = b"\xFF\xFF\xFF\xFFTSource Engine Query\x00"


def _read_string(data: bytes, offset: int) -> tuple[str, int]:
    end = data.find(b"\x00", offset)
    if end == -1:
        return "", len(data)
    return data[offset:end].decode("utf-8", errors="ignore"), end + 1


def parse_a2s_info_response(data: bytes) -> dict | None:
    if len(data) < 6 or data[4] != 0x49:
        return None
    offset = 5
    try:
        _protocol = data[offset]
        offset += 1
        name, offset = _read_string(data, offset)
        map_name, offset = _read_string(data, offset)
        folder, offset = _read_string(data, offset)
        game, offset = _read_string(data, offset)
        if offset + 4 > len(data):
            return None
        app_id = struct.unpack_from("<H", data, offset)[0]
        offset += 2
        players = data[offset]
        offset += 1
        max_players = data[offset]
        return {
            "name": name[:200],
            "map": map_name[:120] or None,
            "game": game[:80] or folder[:80] or None,
            "online": int(players),
            "max_players": int(max_players),
            "app_id": app_id,
            "source": "a2s",
        }
    except Exception:
        return None


def query_a2s_sync(host: str, port: int, timeout: float = 4.0) -> dict | None:
    if not host or port <= 0:
        return None
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout)
    try:
        sock.sendto(A2S_INFO, (host, port))
        data, _ = sock.recvfrom(4096)
        if len(data) >= 5 and data[4] == 0x41:
            challenge = data[5:9]
            sock.sendto(A2S_INFO + challenge, (host, port))
            data, _ = sock.recvfrom(4096)
        return parse_a2s_info_response(data)
    except Exception:
        return None
    finally:
        sock.close()


async def query_a2s(host: str, port: int) -> dict | None:
    return await asyncio.to_thread(query_a2s_sync, host, port)


async def query_mcstatus(host: str, port: int = 25565) -> dict | None:
    address = f"{host}:{port}" if port else host
    url = f"https://api.mcstatus.io/v2/status/java/{address}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, headers={"User-Agent": "SYMBIO-Importer/1.0"})
            if r.status_code >= 400:
                return None
            data = r.json()
            if not data.get("online"):
                return None
            players = data.get("players") or {}
            version = data.get("version") or {}
            return {
                "name": (data.get("motd") or {}).get("clean") or host,
                "map": None,
                "game": "minecraft",
                "online": int(players.get("online") or 0),
                "max_players": int(players.get("max") or 0),
                "version": version.get("name_clean") or version.get("name_raw"),
                "source": "mcstatus.io",
            }
    except Exception:
        return None


async def enrich_server_live(host: str, port: int, game_slug: str) -> dict | None:
    if game_slug == "minecraft":
        return await query_mcstatus(host, port or 25565)
    live = await query_a2s(host, port)
    if live:
        return live
    if port in (25565, 19132):
        return await query_mcstatus(host, port)
    return None


def extract_ip_port(text: str) -> tuple[str, int] | None:
    for m in re.finditer(r"(\d{1,3}(?:\.\d{1,3}){3}):(\d{2,5})", text or ""):
        host, port = m.group(1), int(m.group(2))
        if is_valid_host_port(host, port):
            return host, port
    return None
