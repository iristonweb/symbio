from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_user
from app.db.models.user import User

ROLE_CAPABILITIES: dict[str, set[str]] = {
    "user": {
        "profile.read",
        "profile.write",
        "marketplace.browse",
        "marketplace.purchase",
        "marketplace.review",
        "wishlist.manage",
        "library.read",
    },
    "creator": {
        "profile.read",
        "profile.write",
        "marketplace.browse",
        "marketplace.purchase",
        "marketplace.review",
        "wishlist.manage",
        "library.read",
        "marketplace.product.create",
        "marketplace.product.edit_own",
        "marketplace.analytics_own",
        "payout.request",
    },
    "site_owner": {
        "profile.read",
        "profile.write",
        "marketplace.browse",
        "marketplace.purchase",
        "servers.manage",
        "projects.manage",
        "billing.subscribe",
        "promotions.create",
    },
    "moderator": {
        "profile.read",
        "marketplace.moderate",
        "content.moderate",
    },
    "admin": {
        "admin.users",
        "admin.roles",
        "admin.billing",
        "admin.marketplace",
        "admin.audit",
        "admin.imports",
        "marketplace.moderate",
        "content.moderate",
    },
}


def user_capabilities(user: User) -> set[str]:
    caps: set[str] = set()
    for role in user.roles or ["user"]:
        caps |= ROLE_CAPABILITIES.get(role, set())
    return caps


def has_capability(user: User, capability: str) -> bool:
    return capability in user_capabilities(user)


def require_role(role: str):
    async def _dep(user: User = Depends(get_current_user)) -> User:
        if role not in (user.roles or []):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _dep


def require_capability(capability: str):
    async def _dep(user: User = Depends(get_current_user)) -> User:
        if not has_capability(user, capability):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _dep


def require_any_role(*roles: str):
    async def _dep(user: User = Depends(get_current_user)) -> User:
        user_roles = set(user.roles or [])
        if not user_roles.intersection(roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _dep
