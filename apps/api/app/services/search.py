"""Meilisearch indexing and search."""
from typing import Any

import httpx

from app.core.config import settings

INDEXES = ["games", "projects", "servers", "articles", "marketplace_products"]


def _headers() -> dict:
    return {"Authorization": f"Bearer {settings.MEILI_MASTER_KEY}"}


async def ensure_indexes() -> None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        for idx in INDEXES:
            url = f"{settings.MEILI_URL}/indexes/{idx}"
            r = await client.get(url, headers=_headers())
            if r.status_code == 404:
                await client.post(
                    f"{settings.MEILI_URL}/indexes",
                    headers=_headers(),
                    json={"uid": idx, "primaryKey": "id"},
                )


async def index_documents(index: str, documents: list[dict]) -> None:
    if not documents:
        return
    async with httpx.AsyncClient(timeout=30.0) as client:
        await client.post(
            f"{settings.MEILI_URL}/indexes/{index}/documents",
            headers=_headers(),
            json=documents,
        )


async def search(index: str, q: str, limit: int = 20, filters: str | None = None) -> list[dict[str, Any]]:
    body: dict[str, Any] = {"q": q, "limit": limit}
    if filters:
        body["filter"] = filters
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{settings.MEILI_URL}/indexes/{index}/search",
                headers=_headers(),
                json=body,
            )
            if r.status_code >= 400:
                return []
            return r.json().get("hits", [])
    except Exception:
        return []
