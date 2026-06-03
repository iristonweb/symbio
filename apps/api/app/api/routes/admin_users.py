from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.rbac import require_role, user_capabilities
from app.db.crud import users as users_crud
from app.db.models.user import User

router = APIRouter()


class RoleUpdateIn(BaseModel):
    roles: list[str]


@router.get("/users")
async def admin_list_users(
    _: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    users = await users_crud.list_users(db)
    return {
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "nickname": u.nickname,
                "display_name": u.display_name,
                "email_verified": u.email_verified,
                "roles": u.roles,
                "is_active": u.is_active,
                "capabilities": sorted(user_capabilities(u)),
            }
            for u in users
        ]
    }


@router.patch("/users/{user_id}/roles")
async def admin_update_roles(
    user_id: UUID,
    body: RoleUpdateIn,
    _: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    user = await users_crud.get_by_id(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    allowed = {"user", "creator", "site_owner", "moderator", "admin"}
    roles = list(dict.fromkeys(r for r in body.roles if r in allowed))
    if "user" not in roles:
        roles.insert(0, "user")
    user.roles = roles
    await db.commit()
    return {"id": str(user.id), "roles": user.roles}
