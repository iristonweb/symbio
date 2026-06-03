from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class GenreOut(BaseModel):
    slug: str
    name: str

    class Config:
        from_attributes = True


class GameOut(BaseModel):
    id: UUID
    slug: str
    title: str
    category: str
    platforms: list
    short_description: str | None
    cover_url: str | None
    rating: float
    server_count: int
    genres: list[GenreOut] = []

    class Config:
        from_attributes = True


class ProjectOut(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str | None
    links: dict
    game_slugs: list
    rating: float
    votes: int
    online_total: int
    max_players_total: int
    source_url: str | None = None

    class Config:
        from_attributes = True


class SnapshotOut(BaseModel):
    online: int
    max_players: int
    status: str
    map: str | None
    version: str | None
    ping: int | None
    uptime_percent: float | None
    rank: int | None
    rank_delta: int | None
    created_at: datetime


class ServerOut(BaseModel):
    id: UUID
    game: str
    name: str
    slug: str | None
    host: str
    port: int
    join_url: str | None
    region: str | None
    mode: str | None
    description: str | None
    links: dict
    tags: dict
    rating: float
    votes: int
    claim_status: str
    project_id: UUID | None
    source_url: str | None = None
    snapshot: SnapshotOut | None = None

    class Config:
        from_attributes = True


class ArticleOut(BaseModel):
    id: UUID
    slug: str
    title: str
    excerpt: str | None
    article_type: str
    tags: list
    game_slug: str | None
    published_at: datetime | None

    class Config:
        from_attributes = True


class ArticleDetailOut(ArticleOut):
    body: str


class ContestOut(BaseModel):
    id: UUID
    slug: str
    title: str
    description: str | None
    prize_summary: str | None
    prize_credits: int
    prize_premium_days: int
    status: str
    starts_at: datetime | None
    ends_at: datetime | None

    class Config:
        from_attributes = True


class PlanOut(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str | None
    price_monthly: float
    credits_monthly: int
    features: list

    class Config:
        from_attributes = True


class WalletOut(BaseModel):
    balance_credits: int


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None
    game_slugs: list[str] = []
    links: dict = {}


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None
    game_slugs: list[str] | None = None
    links: dict | None = None


class ServerCreate(BaseModel):
    game: str
    name: str = Field(min_length=2, max_length=200)
    host: str
    port: int = Field(ge=1, le=65535)
    region: str | None = None
    mode: str | None = None
    description: str | None = None
    project_id: UUID | None = None
    tags: dict = {}


class ServerUpdate(BaseModel):
    game: str | None = None
    name: str | None = Field(default=None, min_length=2, max_length=200)
    host: str | None = None
    port: int | None = Field(default=None, ge=1, le=65535)
    region: str | None = None
    mode: str | None = None
    description: str | None = None
    project_id: UUID | None = None
    tags: dict | None = None


class ClaimRequest(BaseModel):
    server_id: UUID
    proof: str | None = None


class VoteResponse(BaseModel):
    vote_id: str
    server_id: str
    votes: int
    rewarded: bool
    earned_tokens: int
    multiplier: float
    wallet_balance: int
    next_vote_at: str | None = None
    social_providers: list[str] = []
    email_verified: bool = False
    owns_game_bonus: bool = False


class PromotionCreate(BaseModel):
    target_type: str = Field(pattern="^(server|project)$")
    target_id: UUID
    promo_type: str = Field(pattern="^(featured|boost|pinned)$")
    days: int = Field(ge=1, le=30, default=7)


class CheckoutRequest(BaseModel):
    plan_slug: str
    provider: str = "mock"


class ImportRunRequest(BaseModel):
    dry_run: bool = True
    limit_games: int = Field(default=20, ge=1, le=500)
    limit_projects: int = Field(default=50, ge=1, le=1000)
    limit_servers: int = Field(default=100, ge=1, le=5000)
