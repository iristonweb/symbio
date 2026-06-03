from uuid import UUID

import boto3
from botocore.config import Config
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.rbac import require_capability
from app.db.crud import marketplace as mp_crud
from app.db.models.user import User
from app.db.models.marketplace import (
    MarketplaceProduct,
    ProductVersion,
    ProductFile,
    ProductDependency,
    ProductCompatibilityReport,
    OrderItem,
    License,
)

router = APIRouter()


def _product_dict(p: MarketplaceProduct, include_pending: bool = False) -> dict:
    if not include_pending and p.moderation_status != "approved":
        return {}
    return {
        "id": str(p.id),
        "slug": p.slug,
        "title": p.title,
        "short_description": p.short_description,
        "description": p.description,
        "product_type": p.product_type,
        "game_slug": p.game_slug,
        "price_rub": p.price_rub,
        "is_free": p.is_free,
        "cover_url": p.cover_url,
        "tags": p.tags,
        "moderation_status": p.moderation_status,
        "sales_count": p.sales_count,
        "rating_avg": p.rating_avg,
        "rating_count": p.rating_count,
        "creator_id": str(p.creator_id),
    }


class ProductCreateIn(BaseModel):
    title: str
    short_description: str | None = None
    description: str | None = None
    product_type: str = "mod"
    game_slug: str | None = None
    price_rub: float = 0
    is_free: bool = False
    cover_url: str | None = None
    tags: list[str] = []
    version: str = "1.0.0"


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    body: str | None = None


class ProductVersionCreateIn(BaseModel):
    version: str
    changelog: str | None = None


class ProductFileCreateIn(BaseModel):
    filename: str
    size_bytes: int = 0
    checksum: str | None = None
    content_type: str = "application/octet-stream"


class ProductDependencyIn(BaseModel):
    target_slug: str
    relation: str = Field(default="requires", pattern="^(requires|conflicts|recommends|compatible)$")
    note: str | None = None


def _s3_client():
    return boto3.client(
        "s3",
        region_name=settings.S3_REGION,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        endpoint_url=settings.S3_ENDPOINT,
        config=Config(signature_version="s3v4"),
    )


def _can_manage_product(user: User, product: MarketplaceProduct) -> bool:
    roles = set(user.roles or [])
    return product.creator_id == user.id or bool(roles.intersection({"admin", "moderator"}))


@router.get("/products")
async def list_products(
    q: str | None = None,
    game: str | None = None,
    type: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    items, total = await mp_crud.list_products(
        db, q=q, game_slug=game, product_type=type, only_approved=True, limit=limit, offset=offset
    )
    return {"items": [d for p in items if (d := _product_dict(p))], "total": total}


@router.get("/compatibility/graph")
async def compatibility_graph(
    game: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    product_stmt = select(MarketplaceProduct).where(
        MarketplaceProduct.moderation_status == "approved",
        MarketplaceProduct.is_active == True,  # noqa: E712
    )
    if game:
        product_stmt = product_stmt.where(MarketplaceProduct.game_slug == game)
    products = (await db.execute(product_stmt.limit(80))).scalars().all()
    product_ids = {p.id for p in products}
    deps = (
        await db.execute(
            select(ProductDependency).where(
                ProductDependency.product_id.in_(product_ids),
                ProductDependency.target_product_id.in_(product_ids),
            )
        )
    ).scalars().all() if product_ids else []
    reports = (
        await db.execute(
            select(ProductCompatibilityReport).where(ProductCompatibilityReport.product_id.in_(product_ids))
        )
    ).scalars().all() if product_ids else []
    confidence_by_product = {
        report.product_id: max(report.confidence, 0.0)
        for report in reports
    }
    return {
        "nodes": [
            {
                "id": str(product.id),
                "slug": product.slug,
                "label": product.title,
                "game": product.game_slug,
                "type": product.product_type,
                "rating": product.rating_avg,
                "sales": product.sales_count,
                "confidence": confidence_by_product.get(product.id, 0.65),
            }
            for product in products
        ],
        "edges": [
            {
                "id": str(dep.id),
                "source": str(dep.product_id),
                "target": str(dep.target_product_id),
                "relation": dep.relation,
                "note": dep.note,
            }
            for dep in deps
        ],
    }


@router.get("/products/{slug}")
async def get_product(slug: str, db: AsyncSession = Depends(get_db)):
    p = await mp_crud.get_product_by_slug(db, slug)
    if not p or p.moderation_status != "approved":
        raise HTTPException(404, "Product not found")
    return _product_dict(p)


@router.get("/products/{slug}/versions")
async def product_versions(slug: str, db: AsyncSession = Depends(get_db)):
    p = await mp_crud.get_product_by_slug(db, slug)
    if not p:
        raise HTTPException(404, "Product not found")
    versions = (
        await db.execute(
            select(ProductVersion)
            .where(ProductVersion.product_id == p.id)
            .order_by(ProductVersion.created_at.desc())
        )
    ).scalars().all()
    result = []
    for version in versions:
        files = (
            await db.execute(select(ProductFile).where(ProductFile.version_id == version.id))
        ).scalars().all()
        result.append(
            {
                "id": str(version.id),
                "version": version.version,
                "changelog": version.changelog,
                "is_latest": version.is_latest,
                "created_at": version.created_at.isoformat(),
                "files": [
                    {
                        "id": str(file.id),
                        "filename": file.filename,
                        "size_bytes": file.size_bytes,
                        "checksum": file.checksum,
                    }
                    for file in files
                ],
            }
        )
    return {"items": result}


@router.post("/products")
async def create_product(
    body: ProductCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if "creator" not in (user.roles or []) and "admin" not in (user.roles or []):
        user.roles = list(set((user.roles or []) + ["creator"]))
    product = await mp_crud.create_product(db, user.id, body.model_dump())
    await db.commit()
    return _product_dict(product, include_pending=True)


@router.post("/products/{slug}/versions")
async def create_product_version(
    slug: str,
    body: ProductVersionCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    product = await mp_crud.get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(404, "Product not found")
    if not _can_manage_product(user, product):
        raise HTTPException(403, "Insufficient permissions")
    existing_versions = (
        await db.execute(select(ProductVersion).where(ProductVersion.product_id == product.id))
    ).scalars().all()
    for row in existing_versions:
        row.is_latest = False
    version = ProductVersion(
        product_id=product.id,
        version=body.version,
        changelog=body.changelog,
        is_latest=True,
    )
    db.add(version)
    await db.commit()
    await db.refresh(version)
    return {"id": str(version.id), "version": version.version, "is_latest": version.is_latest}


@router.post("/products/{slug}/dependencies")
async def add_product_dependency(
    slug: str,
    body: ProductDependencyIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    product = await mp_crud.get_product_by_slug(db, slug)
    target = await mp_crud.get_product_by_slug(db, body.target_slug)
    if not product or not target:
        raise HTTPException(404, "Product not found")
    if not _can_manage_product(user, product):
        raise HTTPException(403, "Insufficient permissions")
    existing = (
        await db.execute(
            select(ProductDependency).where(
                ProductDependency.product_id == product.id,
                ProductDependency.target_product_id == target.id,
                ProductDependency.relation == body.relation,
            )
        )
    ).scalar_one_or_none()
    if existing:
        existing.note = body.note
        dep = existing
    else:
        dep = ProductDependency(
            product_id=product.id,
            target_product_id=target.id,
            relation=body.relation,
            note=body.note,
        )
        db.add(dep)
    await db.commit()
    return {
        "id": str(dep.id),
        "source": product.slug,
        "target": target.slug,
        "relation": dep.relation,
        "note": dep.note,
    }


@router.post("/versions/{version_id}/files")
async def create_product_file(
    version_id: UUID,
    body: ProductFileCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    version = await db.get(ProductVersion, version_id)
    if not version:
        raise HTTPException(404, "Version not found")
    product = await mp_crud.get_product(db, version.product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    if not _can_manage_product(user, product):
        raise HTTPException(403, "Insufficient permissions")
    storage_key = f"products/{product.id}/versions/{version.id}/{body.filename}"
    file = ProductFile(
        version_id=version.id,
        storage_key=storage_key,
        filename=body.filename,
        size_bytes=body.size_bytes,
        checksum=body.checksum,
    )
    db.add(file)
    await db.commit()
    s3 = _s3_client()
    upload_url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": storage_key, "ContentType": body.content_type},
        ExpiresIn=900,
    )
    return {
        "id": str(file.id),
        "key": storage_key,
        "upload": {"url": upload_url, "method": "PUT", "expires_seconds": 900},
    }


@router.get("/products/{slug}/download")
async def download_product(
    slug: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    product = await mp_crud.get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(404, "Product not found")
    license_row = (
        await db.execute(select(License).where(License.user_id == user.id, License.product_id == product.id))
    ).scalar_one_or_none()
    if not (product.is_free or license_row or _can_manage_product(user, product)):
        raise HTTPException(403, "License required")
    version = (
        await db.execute(
            select(ProductVersion)
            .where(ProductVersion.product_id == product.id)
            .order_by(ProductVersion.is_latest.desc(), ProductVersion.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if not version:
        raise HTTPException(404, "No release version")
    file = (
        await db.execute(select(ProductFile).where(ProductFile.version_id == version.id).limit(1))
    ).scalar_one_or_none()
    if not file:
        raise HTTPException(404, "No downloadable file")
    s3 = _s3_client()
    url = s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": file.storage_key},
        ExpiresIn=300,
    )
    return {
        "url": url,
        "method": "GET",
        "filename": file.filename,
        "version": version.version,
        "expires_seconds": 300,
    }


@router.get("/cart")
async def get_cart(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cart = await mp_crud.get_or_create_cart(db, user.id)
    items = await mp_crud.get_cart_items(db, cart.id)
    return {
        "items": [
            {**_product_dict(p), "cart_item_id": str(ci.id)}
            for ci, p in items
        ],
        "total_rub": sum(0 if p.is_free else p.price_rub for _, p in items),
    }


@router.post("/cart/items/{product_id}")
async def add_cart_item(product_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = await mp_crud.get_product(db, product_id)
    if not p or p.moderation_status != "approved":
        raise HTTPException(404, "Product not found")
    await mp_crud.add_to_cart(db, user.id, product_id)
    await db.commit()
    return {"status": "added"}


@router.delete("/cart/items/{product_id}")
async def remove_cart_item(product_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await mp_crud.remove_from_cart(db, user.id, product_id)
    await db.commit()
    return {"status": "removed"}


@router.post("/checkout")
async def checkout(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    order = await mp_crud.checkout_cart(db, user.id, provider="mock")
    if not order:
        raise HTTPException(400, "Cart is empty")
    await db.commit()
    return {"order_id": str(order.id), "status": order.status, "total_rub": order.total_rub}


@router.get("/library")
async def library(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = await mp_crud.user_library(db, user.id)
    return {"items": [{**_product_dict(p), "granted_at": lic.granted_at.isoformat()} for lic, p in rows]}


@router.post("/products/{slug}/reviews")
async def post_review(slug: str, body: ReviewIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = await mp_crud.get_product_by_slug(db, slug)
    if not p:
        raise HTTPException(404, "Product not found")
    review = await mp_crud.add_review(db, user.id, p.id, body.rating, body.body)
    await db.commit()
    return {"id": str(review.id), "rating": review.rating}


@router.post("/products/{slug}/wishlist")
async def wishlist_toggle(slug: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = await mp_crud.get_product_by_slug(db, slug)
    if not p:
        raise HTTPException(404, "Product not found")
    added = await mp_crud.toggle_wishlist(db, user.id, p.id)
    await db.commit()
    return {"wishlisted": added}


@router.get("/creator/products")
async def creator_products(user: User = Depends(require_capability("marketplace.product.edit_own")), db: AsyncSession = Depends(get_db)):
    items, total = await mp_crud.list_products(db, creator_id=user.id, only_approved=False, limit=100)
    return {"items": [_product_dict(p, include_pending=True) for p in items], "total": total}


@router.get("/creator/analytics")
async def creator_analytics(user: User = Depends(require_capability("marketplace.analytics_own")), db: AsyncSession = Depends(get_db)):
    products, total = await mp_crud.list_products(db, creator_id=user.id, only_approved=False, limit=500)
    rows = (
        await db.execute(select(OrderItem).where(OrderItem.creator_id == user.id))
    ).scalars().all()
    gross = sum(row.price_rub for row in rows)
    payout = sum(row.creator_payout_rub for row in rows)
    avg_commission = round(sum(row.commission_percent for row in rows) / len(rows), 2) if rows else 0
    return {
        "products": total,
        "approved": len([p for p in products if p.moderation_status == "approved"]),
        "pending": len([p for p in products if p.moderation_status == "pending"]),
        "sales": len(rows),
        "gross_rub": gross,
        "payout_rub": payout,
        "avg_commission_percent": avg_commission,
    }


@router.post("/moderation/{product_id}/approve")
async def approve_product(
    product_id: UUID,
    user: User = Depends(require_capability("marketplace.moderate")),
    db: AsyncSession = Depends(get_db),
):
    p = await mp_crud.get_product(db, product_id)
    if not p:
        raise HTTPException(404, "Not found")
    p.moderation_status = "approved"
    await db.commit()
    return {"status": "approved"}


@router.post("/moderation/{product_id}/reject")
async def reject_product(
    product_id: UUID,
    note: str = "",
    user: User = Depends(require_capability("marketplace.moderate")),
    db: AsyncSession = Depends(get_db),
):
    p = await mp_crud.get_product(db, product_id)
    if not p:
        raise HTTPException(404, "Not found")
    p.moderation_status = "rejected"
    p.moderation_note = note
    await db.commit()
    return {"status": "rejected"}
