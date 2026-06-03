"""SYMBIO token rewards: vote payouts, social multiplier, referral milestones."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

# Vote rewards
VOTE_BASE_TOKENS = 1
VOTE_FIRST_DAILY_BONUS = 1
VOTE_COOLDOWN_DAYS = 7
MAX_REWARDED_VOTES_PER_DAY = 5
MAX_REWARDED_VOTES_PER_WEEK = 25
MAX_VOTE_TOKENS_PER_MONTH = 80
MIN_ACCOUNT_AGE_HOURS = 48

# Social multiplier (OAuth providers google + steam)
MULT_EMAIL_ONLY = 1.0
MULT_ONE_OAUTH = 1.25
MULT_BOTH_OAUTH = 1.35
SOCIAL_PROVIDERS = frozenset({"google", "steam"})

# Referral
REFERRAL_REFERRER_TOKENS = 20
REFERRAL_REFEREE_TOKENS = 15
REFERRAL_MAX_QUALIFIED_PER_MONTH = 10
REFERRAL_MILESTONE_100 = 100
REFERRAL_TOP_PLAN_SLUG = "owner-network"
REFERRAL_TOP_PLAN_DAYS = 30

REFERRAL_MILESTONES: dict[int, int] = {
    5: 100,
    15: 400,
    30: 1000,
    50: 2500,
    75: 5000,
}


def compute_trust_multiplier(email_verified: bool, oauth_providers: set[str]) -> float:
    linked = oauth_providers & SOCIAL_PROVIDERS
    if not email_verified:
        return MULT_EMAIL_ONLY
    if len(linked) >= 2:
        return MULT_BOTH_OAUTH
    if len(linked) >= 1:
        return MULT_ONE_OAUTH
    return MULT_EMAIL_ONLY


def compute_vote_reward_amount(base: int, multiplier: float, is_first_vote_today: bool) -> int:
    raw = base + (VOTE_FIRST_DAILY_BONUS if is_first_vote_today else 0)
    return max(1, int(raw * multiplier))


def account_age_ok(created_at: datetime) -> bool:
    age = datetime.now(timezone.utc) - created_at
    return age >= timedelta(hours=MIN_ACCOUNT_AGE_HOURS)
