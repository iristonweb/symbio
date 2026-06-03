from fastapi import APIRouter, Request

from app.services.payment_provider import get_payment_provider
from app.db.models.billing_extended import PaymentWebhookEvent

router = APIRouter()


@router.post("/webhooks/{provider}")
async def payment_webhook(provider: str, request: Request):
    payload = await request.json()
    handler = get_payment_provider(provider)
    result = await handler.handle_webhook(payload)
    return {"ok": True, "result": result}
