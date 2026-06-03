from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.db.crud.users import get_by_email, create_user
from app.core.security import hash_password, verify_password, create_access_token
from app.db.crud.audit import add_audit

router = APIRouter()

class RegisterIn(BaseModel):
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    username: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/register", response_model=TokenOut)
async def register(payload: RegisterIn, db: AsyncSession = Depends(get_db)):
    existing = await get_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = await create_user(db, email=payload.email, hashed_password=hash_password(payload.password), roles=["user"])
    await add_audit(db, actor_user_id=user.id, action="user.register", entity_type="user", entity_id=str(user.id), meta={"email": user.email})
    token = create_access_token(subject=user.email, roles=user.roles)
    return TokenOut(access_token=token)

@router.post("/login", response_model=TokenOut)
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await get_by_email(db, payload.username)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    await add_audit(db, actor_user_id=user.id, action="user.login", entity_type="user", entity_id=str(user.id), meta={})
    token = create_access_token(subject=user.email, roles=user.roles)
    return TokenOut(access_token=token)
