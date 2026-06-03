import random
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User

SYMBIO_PREFIXES = ("symbion", "aurora", "pulse", "nexus", "orbit", "flux", "nova", "echo")
SYMBIO_SUFFIXES = ("core", "wave", "grid", "node", "link", "field", "spark", "drift")


def sanitize_nickname(raw: str) -> str:
    s = raw.strip().lower()
    s = re.sub(r"[^a-z0-9_-]", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:48] or "symbion"


def generate_nickname() -> str:
    prefix = random.choice(SYMBIO_PREFIXES)
    suffix = random.choice(SYMBIO_SUFFIXES)
    num = random.randint(1000, 9999)
    return f"{prefix}-{suffix}-{num}"


async def ensure_unique_nickname(db: AsyncSession, preferred: str | None = None) -> str:
    base = sanitize_nickname(preferred) if preferred else generate_nickname()
    candidate = base
    for i in range(20):
        exists = (await db.execute(select(User.id).where(User.nickname == candidate))).scalar_one_or_none()
        if not exists:
            return candidate
        candidate = f"{base}-{random.randint(10, 99)}"
    return f"{generate_nickname()}-{random.randint(100, 999)}"
