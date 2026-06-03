"""Legal source policy: allowlist, rate limits, robots check."""
import time
from urllib.parse import urlparse

import httpx

ALLOWED_DOMAINS = {"wargm.ru", "www.wargm.ru"}
RATE_LIMIT_SECONDS = 1.0
USER_AGENT = "SYMBIO-Importer/1.0 (+https://symbio.local; metadata-only)"

_last_fetch: dict[str, float] = {}


def is_allowed_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.netloc.lower() in ALLOWED_DOMAINS


def rate_limit_wait(domain: str) -> None:
    now = time.time()
    last = _last_fetch.get(domain, 0)
    delta = now - last
    if delta < RATE_LIMIT_SECONDS:
        time.sleep(RATE_LIMIT_SECONDS - delta)
    _last_fetch[domain] = time.time()


async def check_robots_allowed(url: str) -> bool:
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            r = await client.get(robots_url, headers={"User-Agent": USER_AGENT})
            if r.status_code >= 400:
                return True
            text = r.text.lower()
            if "disallow: /" in text and "allow:" not in text:
                return False
            return True
    except Exception:
        return True


def metadata_only_fields() -> set[str]:
    return {
        "name",
        "title",
        "slug",
        "game",
        "host",
        "port",
        "online",
        "max_players",
        "rank",
        "source_url",
        "source_external_id",
        "tags",
        "status",
    }
