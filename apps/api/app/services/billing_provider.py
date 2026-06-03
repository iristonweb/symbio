"""Payment provider abstraction."""
from abc import ABC, abstractmethod
from uuid import UUID


class BillingProvider(ABC):
    @abstractmethod
    async def create_checkout(self, user_id: UUID, amount: float, currency: str, meta: dict) -> dict:
        pass


class MockBillingProvider(BillingProvider):
    async def create_checkout(self, user_id: UUID, amount: float, currency: str, meta: dict) -> dict:
        return {
            "provider": "mock",
            "status": "paid",
            "checkout_url": None,
            "provider_ref": f"mock-{user_id}-{meta.get('plan_slug', 'plan')}",
        }


def get_provider(name: str = "mock") -> BillingProvider:
    return MockBillingProvider()
