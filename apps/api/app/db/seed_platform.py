"""Platform seed: genres, games, plans, demo content."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.game import Game, Genre
from app.db.models.project import Project
from app.db.models.server import Server
from app.db.models.snapshot import ServerSnapshot
from app.db.models.article import Article
from app.db.models.contest import Contest
from app.db.models.billing import Plan, Wallet
from app.db.models.user import User


GENRES = [
    ("survival", "Survival"),
    ("shooter", "Shooter"),
    ("mmorpg", "MMORPG"),
    ("simulator", "Simulator"),
    ("strategy", "Strategy"),
    ("sandbox", "Sandbox"),
]

GAMES = [
    {
        "slug": "dayz",
        "title": "DayZ",
        "category": "client",
        "platforms": ["pc"],
        "short_description": "Hardcore survival in a post-apocalyptic world.",
        "genres": ["survival", "shooter"],
    },
    {
        "slug": "rust",
        "title": "Rust",
        "category": "client",
        "platforms": ["pc"],
        "short_description": "Build, raid, survive.",
        "genres": ["survival", "sandbox"],
    },
    {
        "slug": "arma-3",
        "title": "ARMA 3",
        "category": "client",
        "platforms": ["pc"],
        "short_description": "Military simulation sandbox.",
        "genres": ["shooter", "simulator"],
    },
    {
        "slug": "minecraft",
        "title": "Minecraft",
        "category": "client",
        "platforms": ["pc", "mobile"],
        "short_description": "Creative sandbox worlds.",
        "genres": ["sandbox"],
    },
    {
        "slug": "scum",
        "title": "SCUM",
        "category": "client",
        "platforms": ["pc"],
        "short_description": "Open-world survival with deep mechanics.",
        "genres": ["survival"],
    },
]

PLANS = [
    {
        "slug": "free",
        "name": "Free",
        "description": "Basic listing and limited analytics.",
        "price_monthly": 0,
        "credits_monthly": 0,
        "features": ["basic_listing", "rating"],
    },
    {
        "slug": "premium-owner",
        "name": "Premium Owner",
        "description": "Extended profile, media, analytics, badge.",
        "price_monthly": 499,
        "credits_monthly": 100,
        "features": ["extended_profile", "media_gallery", "analytics", "badge"],
    },
    {
        "slug": "pro-promo",
        "name": "Pro Promo",
        "description": "Featured slots and promotion credits.",
        "price_monthly": 999,
        "credits_monthly": 500,
        "features": ["featured_slots", "priority_search", "promo_credits"],
    },
]


async def seed_platform(db: AsyncSession) -> None:
    genre_map: dict[str, Genre] = {}
    for slug, name in GENRES:
        existing = (await db.execute(select(Genre).where(Genre.slug == slug))).scalar_one_or_none()
        if existing:
            genre_map[slug] = existing
        else:
            g = Genre(slug=slug, name=name)
            db.add(g)
            genre_map[slug] = g
    await db.flush()

    game_map: dict[str, Game] = {}
    for data in GAMES:
        existing = (await db.execute(select(Game).where(Game.slug == data["slug"]))).scalar_one_or_none()
        if existing:
            game_map[data["slug"]] = existing
            continue
        game = Game(
            slug=data["slug"],
            title=data["title"],
            category=data["category"],
            platforms=data["platforms"],
            short_description=data["short_description"],
            rating=4.5,
        )
        for gs in data["genres"]:
            if gs in genre_map:
                game.genres.append(genre_map[gs])
        db.add(game)
        game_map[data["slug"]] = game
    await db.flush()

    for plan_data in PLANS:
        exists = (await db.execute(select(Plan).where(Plan.slug == plan_data["slug"]))).scalar_one_or_none()
        if not exists:
            db.add(Plan(**plan_data))

    server_count = (await db.execute(select(func.count(Server.id)))).scalar_one()
    if not server_count or int(server_count) == 0:
        dayz = game_map.get("dayz")
        project = Project(
            slug="symbio-demo",
            name="SYMBIO Demo Project",
            description="Demo gaming community with multiple servers.",
            game_slugs=["dayz"],
            rating=4.8,
            votes=120,
            online_total=42,
            max_players_total=100,
        )
        db.add(project)
        await db.flush()

        s = Server(
            game_id=dayz.id if dayz else None,
            project_id=project.id,
            game="dayz",
            name="SYMBIO Demo Server",
            slug="symbio-demo-server",
            host="127.0.0.1",
            port=27015,
            region="EU",
            mode="PvP",
            description="Official SYMBIO demo server for development.",
            tags={"featured": True, "pve": False},
            rating=4.9,
            votes=64,
        )
        db.add(s)
        await db.flush()
        db.add(
            ServerSnapshot(
                server_id=s.id,
                online=42,
                max_players=100,
                map="chernarusplus",
                version="1.28",
                status="online",
                uptime_percent=99.5,
                rank=1,
                rank_delta=2,
                ping=25,
            )
        )

    article_count = (await db.execute(select(func.count(Article.id)))).scalar_one()
    if not article_count or int(article_count) == 0:
        now = datetime.now(timezone.utc)
        db.add(
            Article(
                slug="welcome-to-symbio",
                title="Welcome to SYMBIO",
                excerpt="Discover gaming servers, projects and communities.",
                body="SYMBIO is your gaming server ecosystem platform.",
                article_type="news",
                tags=["platform"],
                published_at=now,
            )
        )
        db.add(
            Article(
                slug="server-owner-guide",
                title="Server owner guide",
                excerpt="How to list and promote your server on SYMBIO.",
                body="Create a project, add servers, claim listings, use credits for promotions.",
                article_type="guide",
                tags=["guide"],
                published_at=now,
            )
        )
        db.add(
            Article(
                slug="promo-codes-june-2026",
                title="Promo codes roundup — June 2026",
                excerpt="Active promo codes for popular games.",
                body="Editorial roundup of community-sourced promo codes.",
                article_type="promocode",
                tags=["promo"],
                published_at=now,
            )
        )

    contest_count = (await db.execute(select(func.count(Contest.id)))).scalar_one()
    if not contest_count or int(contest_count) == 0:
        now = datetime.now(timezone.utc)
        db.add(
            Contest(
                slug="premium-giveaway-june",
                title="10 Premium subscriptions giveaway",
                description="Win premium owner subscriptions.",
                prize_summary="10x Premium Owner (30 days)",
                prize_premium_days=30,
                prize_credits=0,
                status="active",
                starts_at=now - timedelta(days=1),
                ends_at=now + timedelta(days=14),
            )
        )

    users = (await db.execute(select(User))).scalars().all()
    for user in users:
        wallet = (await db.execute(select(Wallet).where(Wallet.user_id == user.id))).scalar_one_or_none()
        if not wallet:
            db.add(Wallet(user_id=user.id, balance_credits=50))
