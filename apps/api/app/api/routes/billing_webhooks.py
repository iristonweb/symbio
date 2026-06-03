from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.services.payment_provider import get_payment_provider
from app.db.models.billing_extended import PaymentWebhookEvent

router = APIRouter()


@router.post("/webhooks/{provider}")
async def payment_webhook(provider: str, request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.json()
    handler = get_payment_provider(provider)
    result = await handler.handle_webhook(payload)
    event = PaymentWebhookEvent(
        provider=provider,
        event_type=str(payload.get("event") or payload.get("type") or "unknown"),
        payload=payload,
        processed=bool(result.get("processed", True)),
    )
    db.add(event)
    await db.commit()
    return {"ok": True, "result": result}
