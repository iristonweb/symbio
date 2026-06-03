import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=True
    )
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    links: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    game_slugs: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    votes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    online_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_players_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    moderation_status: Mapped[str] = mapped_column(String(20), nullable=False, default="approved")
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_external_id: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    source_meta: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
