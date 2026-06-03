"""Game catalog normalization for importers."""
from __future__ import annotations

import re
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.game import Game, Genre
from app.importers.normalizers import normalize_game_name, slugify

WARGM_CATEGORY_PATHS: dict[str, str] = {
    "client": "client",
    "browser": "browser",
    "mobile": "mobile",
}

# Popular WARGM titles not always present on category landing pages.
PRIORITY_GAMES: list[tuple[str, str, str, list[str]]] = [
    ("dayz", "DayZ", "client", ["survival", "shooter"]),
    ("rust", "Rust", "client", ["survival", "sandbox"]),
    ("arma-3", "ARMA 3", "client", ["shooter", "simulator"]),
    ("minecraft", "Minecraft", "client", ["sandbox"]),
    ("scum", "SCUM", "client", ["survival"]),
    ("7-days-to-die", "7 Days to Die", "client", ["survival"]),
    ("conan-exiles", "Conan Exiles", "client", ["survival"]),
    ("ark-survival-evolved", "ARK: Survival Evolved", "client", ["survival"]),
    ("squad", "Squad", "client", ["shooter", "simulator"]),
    ("project-zomboid", "Project Zomboid", "client", ["survival"]),
    ("unturned", "Unturned", "client", ["survival", "sandbox"]),
    ("cs-go", "Counter-Strike: GO", "client", ["shooter"]),
    ("counter-strike-2", "Counter-Strike 2", "client", ["shooter"]),
    ("garrys-mod", "Garry's Mod", "client", ["sandbox"]),
    ("space-engineers", "Space Engineers", "client", ["sandbox", "simulator"]),
    ("terraria", "Terraria", "client", ["sandbox"]),
    ("palworld", "Palworld", "client", ["survival", "sandbox"]),
    ("valheim", "Valheim", "client", ["survival"]),
    ("left-4-dead-2", "Left 4 Dead 2", "client", ["shooter"]),
    ("team-fortress-2", "Team Fortress 2", "client", ["shooter"]),
    ("satisfactory", "Satisfactory", "client", ["sandbox"]),
    ("the-forest", "The Forest", "client", ["survival"]),
    ("sons-of-the-forest", "Sons of the Forest", "client", ["survival"]),
    ("insurgency-sandstorm", "Insurgency: Sandstorm", "client", ["shooter"]),
    ("hell-let-loose", "Hell Let Loose", "client", ["shooter", "simulator"]),
]

GAME_HINTS: list[tuple[str, str]] = [
    ("dayz", "dayz"),
    ("rust", "rust"),
    ("arma", "arma-3"),
    ("minecraft", "minecraft"),
    ("scum", "scum"),
    ("zomboid", "project-zomboid"),
    ("squad", "squad"),
    ("unturned", "unturned"),
    ("counter-strike", "counter-strike-2"),
    ("cs:go", "cs-go"),
    ("csgo", "cs-go"),
    ("garry", "garrys-mod"),
    ("space engineers", "space-engineers"),
    ("7 days", "7-days-to-die"),
    ("conan", "conan-exiles"),
    ("ark", "ark-survival-evolved"),
    ("palworld", "palworld"),
    ("valheim", "valheim"),
    ("left 4 dead", "left-4-dead-2"),
    ("tf2", "team-fortress-2"),
    ("team fortress", "team-fortress-2"),
    ("satisfactory", "satisfactory"),
    ("the forest", "the-forest"),
    ("sons of the forest", "sons-of-the-forest"),
    ("insurgency", "insurgency-sandstorm"),
    ("hell let loose", "hell-let-loose"),
    ("cs2", "counter-strike-2"),
    ("terraria", "terraria"),
]


def detect_game_from_text(text: str) -> str | None:
    lower = (text or "").lower()
    for hint, slug in GAME_HINTS:
        if hint in lower:
            return slug
    return None


def title_from_slug(slug: str) -> str:
    return slug.replace("-", " ").replace("_", " ").title()


def parse_games_listing_page(html: str, category: str) -> list[dict]:
    games: list[dict] = []
    seen: set[str] = set()
    for m in re.finditer(
        r'href="/game/([^"#/?]+)"[^>]*>\s*<h3[^>]*>\s*([^<]+?)\s*</h3>',
        html,
        re.I,
    ):
        slug = normalize_game_name(m.group(1))
        if slug in seen or slug.endswith("screenshots") or slug.endswith("requirements"):
            continue
        seen.add(slug)
        games.append(
            {
                "slug": slug,
                "title": m.group(2).strip()[:200],
                "category": category,
            }
        )
    return games


async def ensure_game(
    db: AsyncSession,
    *,
    slug: str,
    title: str | None = None,
    category: str = "client",
    source_url: str | None = None,
    dry_run: bool = False,
) -> tuple[Game | None, bool]:
    slug = normalize_game_name(slug)
    if not slug:
        return None, False
    existing = (await db.execute(select(Game).where(Game.slug == slug))).scalar_one_or_none()
    if existing:
        if not dry_run:
            existing.source_meta = {
                **(existing.source_meta or {}),
                "imported_from": "wargm",
                "metadata_only": True,
            }
            if source_url and not existing.source_url:
                existing.source_url = source_url
        return existing, False
    if dry_run:
        return None, True
    game = Game(
        slug=slug,
        title=(title or title_from_slug(slug))[:200],
        category=category,
        platforms=["pc"] if category == "client" else [category],
        short_description=f"{title or title_from_slug(slug)} — community servers indexed on SYMBIO.",
        source_url=source_url,
        source_meta={"imported_from": "wargm", "metadata_only": True},
    )
    db.add(game)
    await db.flush()
    return game, True


async def link_game_genres(db: AsyncSession, game: Game, genre_slugs: list[str]) -> None:
    if not genre_slugs:
        return
    from sqlalchemy.orm import selectinload

    loaded = (
        await db.execute(select(Game).options(selectinload(Game.genres)).where(Game.id == game.id))
    ).scalar_one()
    existing = {g.id for g in loaded.genres}
    genres = (
        await db.execute(select(Genre).where(Genre.slug.in_(genre_slugs)))
    ).scalars().all()
    for genre in genres:
        if genre.id not in existing:
            loaded.genres.append(genre)


async def refresh_game_server_counts(db: AsyncSession) -> int:
    from app.db.models.server import Server

    rows = (
        await db.execute(select(Server.game, func.count()).group_by(Server.game))
    ).all()
    updated = 0
    for game_slug, count in rows:
        game = (await db.execute(select(Game).where(Game.slug == game_slug))).scalar_one_or_none()
        if game and game.server_count != count:
            game.server_count = int(count)
            updated += 1
    return updated
