from fastapi import Depends, HTTPException, status
from app.api.deps import get_current_user
from app.db.models.user import User

def require_role(role: str):
    async def _dep(user: User = Depends(get_current_user)) -> User:
        if role not in (user.roles or []):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return _dep
