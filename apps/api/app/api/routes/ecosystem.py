"""Live ecosystem data for radar / home page."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.db.models.server import Server
from app.db.models.snapshot import ServerSnapshot
from app.db.models.game import Game
from app.db.models.project import Project
from app.db.models.marketplace import MarketplaceProduct
from app.db.models.event import EventLog

router = APIRouter()


@router.get("/radar")
async def ecosystem_radar(db: AsyncSession = Depends(get_db)):
    servers = (await db.execute(select(Server).limit(12))).scalars().all()
    server_items = []
    for s in servers:
        snap = (
            await db.execute(
                select(ServerSnapshot)
                .where(ServerSnapshot.server_id == s.id)
                .order_by(ServerSnapshot.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        server_items.append(
            {
                "id": str(s.id),
                "name": s.name,
                "game": s.game,
                "region": s.region,
                "mode": s.mode,
                "online": snap.online if snap else 0,
                "max_players": snap.max_players if snap else 0,
                "status": snap.status if snap else "unknown",
                "href": f"/servers/{s.id}",
            }
        )

    games = (await db.execute(select(Game).limit(8))).scalars().all()
    projects = (await db.execute(select(Project).limit(6))).scalars().all()
    product_rows = (
        await db.execute(
            select(MarketplaceProduct)
            .where(
                MarketplaceProduct.moderation_status == "approved",
                MarketplaceProduct.is_active == True,  # noqa: E712
            )
            .order_by(MarketplaceProduct.sales_count.desc())
            .limit(6)
        )
    ).scalars().all()

    online_total = sum(x["online"] for x in server_items)
    return {
        "servers": server_items,
        "games": [{"slug": g.slug, "title": g.title, "href": f"/games/{g.slug}"} for g in games],
        "projects": [{"slug": p.slug, "name": p.name, "href": f"/projects/{p.slug}"} for p in projects],
        "products": [
            {"slug": p.slug, "title": p.title, "price_rub": p.price_rub, "href": f"/marketplace/{p.slug}"}
            for p in product_rows
        ],
        "stats": {
            "servers_online": online_total,
            "server_count": len(server_items),
            "game_count": len(games),
            "product_count": len(product_rows),
        },
    }


@router.get("/copilot")
async def growth_copilot(db: AsyncSession = Depends(get_db)):
    servers = (await db.execute(select(Server).limit(50))).scalars().all()
    products = (
        await db.execute(
            select(MarketplaceProduct)
            .where(MarketplaceProduct.moderation_status == "approved")
            .order_by(MarketplaceProduct.sales_count.desc())
            .limit(12)
        )
    ).scalars().all()
    event_count = (await db.execute(select(func.count(EventLog.id)))).scalar_one()

    server_cards = []
    for s in servers[:12]:
        snap = (
            await db.execute(
                select(ServerSnapshot)
                .where(ServerSnapshot.server_id == s.id)
                .order_by(ServerSnapshot.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        online = snap.online if snap else 0
        max_players = snap.max_players if snap and snap.max_players else 0
        load = round((online / max_players) * 100) if max_players else 0
        server_cards.append(
            {
                "id": str(s.id),
                "name": s.name,
                "game": s.game,
                "mode": s.mode,
                "online": online,
                "max_players": max_players,
                "load": load,
                "rating": s.rating,
                "votes": s.votes,
                "href": f"/servers/{s.id}",
            }
        )

    total_online = sum(s["online"] for s in server_cards)
    avg_load = round(sum(s["load"] for s in server_cards) / len(server_cards)) if server_cards else 0
    top_product = products[0] if products else None

    recommendations = []
    if avg_load < 35:
        recommendations.append(
            {
                "type": "activation",
                "title": "Усильте первый вход",
                "impact": "high",
                "action": "Добавьте на карточку сервера конкретный стартовый сценарий: wipe countdown, starter kit или событие недели.",
            }
        )
    if top_product:
        recommendations.append(
            {
                "type": "cross-sell",
                "title": f"Свяжите серверы с {top_product.title}",
                "impact": "medium",
                "action": "Покажите совместимые моды на странице сервера и предложите bundle владельцам похожих проектов.",
            }
        )
    recommendations.append(
        {
            "type": "experiment",
            "title": "Запустите A/B карточку сервера",
            "impact": "medium",
            "action": "Сравните cinematic banner против expert-metrics карточки и продвигайте победителя через credits.",
        }
    )

    return {
        "metrics": {
            "servers": len(server_cards),
            "online": total_online,
            "avg_load": avg_load,
            "products": len(products),
            "events": event_count,
        },
        "servers": server_cards,
        "products": [
            {
                "slug": p.slug,
                "title": p.title,
                "game": p.game_slug,
                "sales": p.sales_count,
                "rating": p.rating_avg,
                "href": f"/marketplace/{p.slug}",
            }
            for p in products
        ],
        "recommendations": recommendations,
    }
