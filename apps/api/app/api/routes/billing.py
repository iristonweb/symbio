from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.crud import billing as billing_crud
from app.db.models.user import User
from app.schemas.platform import CheckoutRequest, PromotionCreate

router = APIRouter()


@router.get("/plans")
async def get_plans(db: AsyncSession = Depends(get_db)):
    plans = await billing_crud.list_plans(db)
    return {
        "items": [
            {
                "id": str(p.id),
                "slug": p.slug,
                "name": p.name,
                "description": p.description,
                "price_monthly": p.price_monthly,
                "credits_monthly": p.credits_monthly,
                "features": p.features,
            }
            for p in plans
        ]
    }


@router.get("/wallet")
async def get_wallet(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    balance = await billing_crud.get_wallet_balance(db, user.id)
    txs = await billing_crud.list_wallet_transactions(db, user.id)
    return {"balance_credits": balance, "transactions": txs}


@router.post("/checkout")
async def post_checkout(
    body: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await billing_crud.checkout_plan(db, user.id, body.plan_slug, body.provider)
        await db.commit()
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/promotions")
async def post_promotion(
    body: PromotionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    promo = await billing_crud.create_promotion(
        db, user.id, body.target_type, body.target_id, body.promo_type, body.days
    )
    if not promo:
        await db.rollback()
        raise HTTPException(status_code=402, detail="Insufficient credits")
    await db.commit()
    return {"id": str(promo.id), "promo_type": promo.promo_type, "ends_at": promo.ends_at.isoformat()}
