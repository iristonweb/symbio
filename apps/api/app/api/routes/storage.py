from fastapi import APIRouter, Depends, Query
import boto3
from botocore.config import Config

from app.core.config import settings
from app.api.deps import get_current_user
from app.db.models.user import User

router = APIRouter()

def _s3_client():
    return boto3.client(
        "s3",
        region_name=settings.S3_REGION,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        endpoint_url=settings.S3_ENDPOINT,
        config=Config(signature_version="s3v4"),
    )

@router.get("/presign-upload")
async def presign_upload(
    key: str = Query(..., min_length=1),
    content_type: str = Query(default="application/octet-stream"),
    expires_seconds: int = Query(default=300, ge=30, le=3600),
    _: User = Depends(get_current_user),
):
    s3 = _s3_client()
    url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": key, "ContentType": content_type},
        ExpiresIn=expires_seconds,
    )
    return {"url": url, "method": "PUT", "bucket": settings.S3_BUCKET, "key": key, "expires_seconds": expires_seconds}

@router.get("/presign-download")
async def presign_download(
    key: str = Query(..., min_length=1),
    expires_seconds: int = Query(default=300, ge=30, le=3600),
    _: User = Depends(get_current_user),
):
    s3 = _s3_client()
    url = s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": key},
        ExpiresIn=expires_seconds,
    )
    return {"url": url, "method": "GET", "bucket": settings.S3_BUCKET, "key": key, "expires_seconds": expires_seconds}
