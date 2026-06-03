"""Steam AppID ↔ SYMBIO game slug registry."""

from __future__ import annotations

# appid → symbio slug
STEAM_APP_TO_SYMBIO_SLUG: dict[int, str] = {
    221100: "dayz",
    252490: "rust",
    107410: "arma-3",
    346110: "ark-survival-evolved",
    440: "team-fortress-2",
    730: "counter-strike-2",
    10: "counter-strike-2",
    240: "counter-strike-2",
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
    550: "left-4-dead-2",
    526870: "satisfactory",
}


def slug_for_appid(appid: int) -> str | None:
    return STEAM_APP_TO_SYMBIO_SLUG.get(appid)


def appids_for_slug(slug: str) -> list[int]:
    return [appid for appid, s in STEAM_APP_TO_SYMBIO_SLUG.items() if s == slug]


def steam_meta_for_slug(slug: str) -> dict:
    ids = appids_for_slug(slug)
    if not ids:
        return {}
    return {"steam_app_ids": sorted(set(ids))}
