"""Payment provider abstraction — mock now, YooKassa/CloudPayments ready."""

from uuid import UUID

from app.core.config import settings


class PaymentProvider:
    name: str = "mock"

    async def create_checkout(
        self,
        *,
        user_id: UUID,
        amount: float,
        currency: str,
        description: str,
        return_url: str,
        meta: dict,
    ) -> dict:
        ref = f"mock-{user_id}-{meta.get('kind', 'payment')}"
        return {
            "provider": self.name,
            "status": "paid",
            "provider_ref": ref,
            "payment_url": return_url,
        }

    async def handle_webhook(self, payload: dict) -> dict:
        return {"ok": True, "provider": self.name, "payload": payload}


class YooKassaProvider(PaymentProvider):
    name = "yukassa"

    async def create_checkout(self, **kwargs) -> dict:
        if not settings.YUKASSA_SHOP_ID:
            return await PaymentProvider().create_checkout(**kwargs)
        return {
            "provider": self.name,
            "status": "pending",
            "provider_ref": None,
            "payment_url": kwargs["return_url"],
            "note": "Configure YUKASSA credentials for live payments",
        }


class CloudPaymentsProvider(PaymentProvider):
    name = "cloudpayments"

    async def create_checkout(self, **kwargs) -> dict:
        if not settings.CLOUDPAYMENTS_PUBLIC_ID:
            return await PaymentProvider().create_checkout(**kwargs)
        return {
            "provider": self.name,
            "status": "pending",
            "provider_ref": None,
            "payment_url": kwargs["return_url"],
            "note": "Configure CloudPayments credentials for live payments",
        }


def get_payment_provider(name: str | None = None) -> PaymentProvider:
    provider = name or settings.PAYMENT_PROVIDER
    if provider == "yukassa":
        return YooKassaProvider()
    if provider == "cloudpayments":
        return CloudPaymentsProvider()
    return PaymentProvider()
