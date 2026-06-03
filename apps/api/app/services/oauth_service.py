"""OAuth helpers for Google and Steam (OpenID + Web API profile)."""

import secrets
from urllib.parse import urlencode

import httpx

from app.core.config import settings

_pending_oauth: dict[str, dict] = {}


def google_auth_url(state: str) -> str:
    if not settings.GOOGLE_CLIENT_ID:
        return f"{settings.WEB_BASE_URL}/auth/oauth-callback?provider=google&dev=1&state={state}"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": f"{settings.API_BASE_URL}/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)


def steam_auth_url(state: str) -> str:
    if not settings.STEAM_API_KEY:
        return f"{settings.WEB_BASE_URL}/auth/oauth-callback?provider=steam&dev=1&state={state}"
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": f"{settings.API_BASE_URL}/auth/steam/callback?state={state}",
        "openid.realm": settings.API_BASE_URL,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    return "https://steamcommunity.com/openid/login?" + urlencode(params)


def create_oauth_state(provider: str, extra: dict | None = None) -> str:
    state = secrets.token_urlsafe(24)
    payload: dict = {"provider": provider}
    if extra:
        payload.update(extra)
    _pending_oauth[state] = payload
    return state


def pop_oauth_state(state: str) -> dict | None:
    return _pending_oauth.pop(state, None)


async def exchange_google_code(code: str) -> dict:
    if not settings.GOOGLE_CLIENT_ID:
        return {
            "provider_user_id": f"dev-google-{secrets.token_hex(4)}",
            "email": f"google_{secrets.token_hex(3)}@symbio.dev",
            "name": "Google Dev User",
        }
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": f"{settings.API_BASE_URL}/auth/google/callback",
                "grant_type": "authorization_code",
            },
        )
        token_res.raise_for_status()
        tokens = token_res.json()
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        user_res.raise_for_status()
        data = user_res.json()
    return {
        "provider_user_id": data["sub"],
        "email": data.get("email"),
        "name": data.get("name"),
    }


def parse_steam_id_from_claimed(claimed_id: str) -> str:
    return claimed_id.rstrip("/").split("/")[-1]


async def verify_steam_openid(params: dict[str, str]) -> bool:
    """Validate Steam OpenID response via check_authentication."""
    if params.get("openid.mode") != "id_res":
        return False
    payload = {**params, "openid.mode": "check_authentication"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post("https://steamcommunity.com/openid/login", data=payload)
        res.raise_for_status()
        body = res.text
    return "is_valid:true" in body


async def fetch_steam_profile(steam_id: str) -> dict:
    if not settings.STEAM_API_KEY:
        return {"personaname": f"Steam {steam_id}", "avatarfull": None}
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
            params={"key": settings.STEAM_API_KEY, "steamids": steam_id},
        )
        res.raise_for_status()
        players = res.json().get("response", {}).get("players", [])
    if not players:
        return {"personaname": f"Steam {steam_id}", "avatarfull": None}
    player = players[0]
    return {
        "personaname": player.get("personaname") or f"Steam {steam_id}",
        "avatarfull": player.get("avatarfull"),
        "profileurl": player.get("profileurl"),
    }
