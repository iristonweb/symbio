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
from app.db.models.billing_extended import CommissionRule
from app.db.models.user import User
from app.db.models.marketplace import MarketplaceProduct, ProductVersion


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
    # Users
    {"slug": "user-free", "name": "Free", "audience": "user", "description": "Базовый профиль, wishlist, покупки и отзывы.", "price_monthly": 0, "credits_monthly": 0, "sort_order": 0, "features": ["profile", "wishlist", "purchases", "reviews"]},
    {"slug": "user-plus", "name": "Plus", "audience": "user", "description": "Расширенная библиотека, уведомления, ранний доступ к скидкам.", "price_monthly": 299, "credits_monthly": 100, "sort_order": 1, "features": ["library_plus", "notifications", "early_deals", "badge_plus"]},
    {"slug": "user-pro", "name": "Pro Player", "audience": "user", "description": "Приоритетная поддержка, коллекции, бейдж Pro.", "price_monthly": 699, "credits_monthly": 300, "sort_order": 2, "features": ["collections", "priority_support", "badge_pro", "credits_300"]},
    # Site owners
    {"slug": "owner-starter", "name": "Starter", "audience": "site_owner", "description": "1 проект, базовый листинг серверов.", "price_monthly": 0, "credits_monthly": 0, "sort_order": 10, "features": ["1_project", "basic_listing"]},
    {"slug": "owner-premium", "name": "Owner Premium", "audience": "site_owner", "description": "3 проекта, расширенная карточка, 1000 промо-кредитов.", "price_monthly": 1490, "credits_monthly": 1000, "sort_order": 11, "features": ["3_projects", "extended_card", "analytics_basic", "badge_owner"]},
    {"slug": "owner-growth", "name": "Growth", "audience": "site_owner", "description": "10 проектов, промо-кампании, аналитика.", "price_monthly": 4990, "credits_monthly": 5000, "sort_order": 12, "features": ["10_projects", "promo_campaigns", "analytics_pro"]},
    {"slug": "owner-network", "name": "Network", "audience": "site_owner", "description": "Мультипроект, команда, API/export.", "price_monthly": 14990, "credits_monthly": 20000, "sort_order": 13, "features": ["unlimited_projects", "team", "api_export", "priority_support"]},
    # Creators / modders
    {"slug": "creator-free", "name": "Creator Free", "audience": "creator", "description": "Публикация после модерации, комиссия 15%.", "price_monthly": 0, "credits_monthly": 0, "commission_percent": 15.0, "sort_order": 20, "features": ["publish_after_moderation", "commission_15"]},
    {"slug": "creator-pro", "name": "Creator Pro", "audience": "creator", "description": "Комиссия 10%, аналитика, приоритетная модерация.", "price_monthly": 990, "credits_monthly": 200, "commission_percent": 10.0, "sort_order": 21, "features": ["commission_10", "analytics", "priority_moderation"]},
    {"slug": "creator-studio", "name": "Studio", "audience": "creator", "description": "Комиссия 7%, команда, bundles, промо.", "price_monthly": 2990, "credits_monthly": 500, "commission_percent": 7.0, "sort_order": 22, "features": ["commission_7", "team", "bundles", "promo_tools"]},
    # Legacy slugs kept for compatibility
    {"slug": "free", "name": "Free (legacy)", "audience": "site_owner", "description": "Basic listing.", "price_monthly": 0, "credits_monthly": 0, "sort_order": 99, "features": ["basic_listing"]},
    {"slug": "premium-owner", "name": "Premium Owner (legacy)", "audience": "site_owner", "description": "Extended profile.", "price_monthly": 1490, "credits_monthly": 1000, "sort_order": 99, "features": ["extended_profile"]},
    {"slug": "pro-promo", "name": "Pro Promo (legacy)", "audience": "site_owner", "description": "Promo credits.", "price_monthly": 4990, "credits_monthly": 5000, "sort_order": 99, "features": ["promo_credits"]},
]

MARKETPLACE_DEMO = [
    {"slug": "dayz-hardcore-ui", "title": "DayZ Hardcore UI Pack", "product_type": "mod", "game_slug": "dayz", "price_rub": 349, "tags": ["ui", "hardcore"]},
    {"slug": "rust-base-blueprint", "title": "Rust Base Blueprint Collection", "product_type": "addon", "game_slug": "rust", "price_rub": 499, "tags": ["building"]},
    {"slug": "arma-tactical-ops", "title": "ARMA Tactical Ops Mod", "product_type": "mod", "game_slug": "arma-3", "price_rub": 0, "is_free": True, "tags": ["milsim"]},
    {"slug": "minecraft-symbio-pack", "title": "SYMBIO Minecraft Texture Pack", "product_type": "resource_pack", "game_slug": "minecraft", "price_rub": 199, "tags": ["textures"]},
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
        if exists:
            for key in ("name", "description", "audience", "price_monthly", "credits_monthly", "commission_percent", "features", "sort_order"):
                if key in plan_data and hasattr(exists, key):
                    setattr(exists, key, plan_data[key])
        else:
            db.add(Plan(**plan_data))

    for rule in [("creator-free", 15.0), ("creator-pro", 10.0), ("creator-studio", 7.0)]:
        slug, pct = rule
        r = (await db.execute(select(CommissionRule).where(CommissionRule.plan_slug == slug))).scalar_one_or_none()
        if not r:
            db.add(CommissionRule(plan_slug=slug, percent=pct, description=f"Commission for {slug}"))

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
    creator = users[0] if users else None
    for user in users:
        wallet = (await db.execute(select(Wallet).where(Wallet.user_id == user.id))).scalar_one_or_none()
        if not wallet:
            db.add(Wallet(user_id=user.id, balance_credits=50))

    if creator:
        for item in MARKETPLACE_DEMO:
            exists = (await db.execute(select(MarketplaceProduct).where(MarketplaceProduct.slug == item["slug"]))).scalar_one_or_none()
            if exists:
                continue
            p = MarketplaceProduct(
                creator_id=creator.id,
                slug=item["slug"],
                title=item["title"],
                short_description=f"Демо-продукт SYMBIO — {item['title']}",
                description="Полноценный marketplace-контент для запуска платформы.",
                product_type=item["product_type"],
                game_slug=item.get("game_slug"),
                price_rub=item.get("price_rub", 0),
                is_free=item.get("is_free", False),
                tags=item.get("tags", []),
                moderation_status="approved",
                sales_count=12,
                rating_avg=4.7,
                rating_count=8,
            )
            db.add(p)
            await db.flush()
            db.add(ProductVersion(product_id=p.id, version="1.0.0", is_latest=True))
