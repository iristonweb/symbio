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
from app.core.security import hash_password


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
    {
        "slug": "dayz-hardcore-ui",
        "title": "DayZ Hardcore UI Pack",
        "product_type": "mod",
        "game_slug": "dayz",
        "price_rub": 349,
        "tags": ["ui", "hardcore"],
        "short_description": "Минималистичный HUD для хардкор-серверов: онлайн фракций, таймер вайпа, статус ранения.",
        "description": "Пак заменяет стандартный интерфейс на читаемый в PvP. Совместим с большинством модов экономики. Установка: распаковать в папку миссии, прописать в serverDZ.cfg. Требуется DayZ 1.25+.",
    },
    {
        "slug": "rust-base-blueprint",
        "title": "Rust Base Blueprint Collection",
        "product_type": "addon",
        "game_slug": "rust",
        "price_rub": 499,
        "tags": ["building"],
        "short_description": "50 проверенных схем баз для wipe: от соло до клановых compound.",
        "description": "Каждая схема с материалами, TC placement и anti-raid notes. Формат: JSON + превью PNG. Подходит для серверов x2–x5.",
    },
    {
        "slug": "arma-tactical-ops",
        "title": "ARMA Tactical Ops Mod",
        "product_type": "mod",
        "game_slug": "arma-3",
        "price_rub": 0,
        "is_free": True,
        "tags": ["milsim"],
        "short_description": "MilSim-миссии, ACE-совместимые триггеры и баланс отрядов 8–32 игрока.",
        "description": "Бесплатный мод для сообществ ARMA 3. Включает 12 миссий, Zeus-шаблоны и документацию по настройке dedicated.",
    },
    {
        "slug": "minecraft-symbio-pack",
        "title": "SYMBIO Minecraft Texture Pack",
        "product_type": "resource_pack",
        "game_slug": "minecraft",
        "price_rub": 199,
        "tags": ["textures"],
        "short_description": "Текстуры 32× в стиле SYMBIO для SMP и ивент-серверов.",
        "description": "Resource pack без optifine-зависимостей. Поддержка 1.20+. Лицензия: одна копия на сервер до 200 слотов.",
    },
]

ARTICLES = [
    {
        "slug": "welcome-to-symbio",
        "title": "Запуск SYMBIO: что уже работает",
        "excerpt": "Радар серверов, маркет, студия владельца и тарифы — краткий обзор для игроков и админов.",
        "body": """SYMBIO — экосистема для поиска серверов, проектов и контента создателей.

Уже доступно:
• Радар серверов с онлайн, рейтингом и фильтрами по стилю игры
• Каталог игр и проектов сообществ
• Marketplace: моды, аддоны, resource packs с лицензией и библиотекой
• Студия: создание проекта и сервера (host/port, теги)
• Тарифы для игроков, владельцев серверов и creators

Для локальной разработки: API на :8000, web на :3000. После init_db появляются demo-сервер и статьи в разделах Новости, Гайды, Промокоды.

Следующий шаг для владельца: /studio → создать проект → добавить сервер → тариф Owner Premium для промо-кредитов.""",
        "article_type": "news",
        "tags": ["platform", "launch"],
    },
    {
        "slug": "server-owner-guide",
        "title": "Гайд владельца: листинг и продвижение сервера",
        "excerpt": "Проект, сервер, claim, кредиты и аналитика — по шагам без лишней теории.",
        "body": """1. Войдите и откройте /studio
2. Создайте проект: название, описание, slug игр через запятую (dayz, rust)
3. Добавьте сервер: host, port, режим (PvP/PvE), регион
4. Проверьте карточку на /servers — онлайн подтягивается из снапшотов API
5. Тарифы (/billing): Owner Premium даёт промо-кредиты и расширенную карточку
6. Импорт метаданных (/admin/imports): только публичные поля, без копирования текстов

Важно: описание и баннер — ваши; SYMBIO не дублирует чужой контент. Голоса и рейтинг влияют на сортировку в радаре.""",
        "article_type": "guide",
        "tags": ["guide", "owner"],
    },
    {
        "slug": "promo-codes-june-2026",
        "title": "Промокоды — июнь 2026 (подборка)",
        "excerpt": "Примеры кодов для теста раздела. Проверяйте актуальность на сайте издателя.",
        "body": """Редакционная подборка (демо):

SYMBIO-DEV — тестовые 100 кредитов на staging (если включён mock billing)
CREATOR-START — скидка 10% на Creator Pro первый месяц (маркетинг, уточняйте в /billing)

Правила:
• Один код на аккаунт, если не указано иное
• Срок действия смотрите в новостях конкретной игры
• SYMBIO не гарантирует коды сторонних издателей — только агрегирует публичные объявления""",
        "article_type": "promocode",
        "tags": ["promo", "june-2026"],
    },
    {
        "slug": "marketplace-creator-guide",
        "title": "Гайд creator: публикация мода в маркете",
        "excerpt": "Тип продукта, версии, модерация и комиссия по тарифу.",
        "body": """1. Роль creator + тариф Creator Free/Pro/Studio (/billing)
2. /studio → вкладка продукта: название, тип (mod/addon/resource_pack), игра, цена
3. После модерации (approved) товар виден в /marketplace
4. Покупатель: корзина → checkout (mock) → /marketplace/library
5. Комиссия: 15% Free, 10% Pro, 7% Studio — см. планы creator

Загрузка файлов: версия 1.0.0 + changelog. Compatibility Graph строится из зависимостей между продуктами одной игры.""",
        "article_type": "guide",
        "tags": ["guide", "creator", "marketplace"],
    },
    {
        "slug": "season-wipe-radar",
        "title": "Сезон и вайпы: как читать радар",
        "excerpt": "Фильтры стиля, сезонная шкала на главной и что значит «давление вайпа».",
        "body": """На главной (/): фильтры Hardcore, MilSim, PvP, SMP — сужают рекомендации в радаре.

Сезонная шкала показывает окна вайпов и ивентов (из ecosystem API или fallback).

На карточке сервера: онлайн/макс, аптайм, место в рейтинге. Подключение: steam://connect или join_url.

Для владельца: следите за rank_delta в снапшотах — резкий минус часто совпадает с вайпом конкурента.""",
        "article_type": "news",
        "tags": ["season", "radar"],
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
            description="Демо-проект SYMBIO: хардкор DayZ, один сервер для теста радара и студии владельца.",
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
            description="Демо-сервер SYMBIO (EU, PvP). Подключение: 127.0.0.1:27015. Используйте для проверки карточки и снапшотов.",
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

    now = datetime.now(timezone.utc)
    for article_data in ARTICLES:
        existing = (await db.execute(select(Article).where(Article.slug == article_data["slug"]))).scalar_one_or_none()
        if existing:
            for key in ("title", "excerpt", "body", "article_type", "tags"):
                setattr(existing, key, article_data[key])
            if not existing.published_at:
                existing.published_at = now
        else:
            db.add(Article(**article_data, published_at=now))

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

    admin = (
        await db.execute(
            select(User).where(User.email.in_(["admin@symbio.local", "admin@symbio.dev"]))
        )
    ).scalar_one_or_none()
    if admin and admin.email == "admin@symbio.local":
        admin.email = "admin@symbio.dev"
    if not admin:
        admin = User(
            email="admin@symbio.dev",
            hashed_password=hash_password("admin123"),
            nickname="symbio-admin",
            display_name="SYMBIO Admin",
            roles=["user", "admin", "moderator", "site_owner", "creator"],
            email_verified=True,
        )
        db.add(admin)
        await db.flush()

    users = (await db.execute(select(User))).scalars().all()
    creator = admin or (users[0] if users else None)
    for user in users:
        wallet = (await db.execute(select(Wallet).where(Wallet.user_id == user.id))).scalar_one_or_none()
        if not wallet:
            db.add(Wallet(user_id=user.id, balance_credits=50))

    if creator:
        for item in MARKETPLACE_DEMO:
            exists = (await db.execute(select(MarketplaceProduct).where(MarketplaceProduct.slug == item["slug"]))).scalar_one_or_none()
            if exists:
                for key in ("title", "short_description", "description", "product_type", "game_slug", "price_rub", "is_free", "tags"):
                    if key in item:
                        setattr(exists, key, item[key])
                continue
            p = MarketplaceProduct(
                creator_id=creator.id,
                slug=item["slug"],
                title=item["title"],
                short_description=item.get("short_description", f"Демо — {item['title']}"),
                description=item.get("description", "Контент SYMBIO Marketplace для запуска платформы."),
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
