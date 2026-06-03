from app.services import rewards as r


def test_trust_multiplier_email_only():
    assert r.compute_trust_multiplier(False, set()) == 1.0


def test_trust_multiplier_one_oauth():
    assert r.compute_trust_multiplier(True, {"google"}) == 1.25


def test_trust_multiplier_both_oauth():
    assert r.compute_trust_multiplier(True, {"google", "steam"}) == 1.35


def test_vote_reward_first_daily_bonus():
    amount = r.compute_vote_reward_amount(1, 1.25, is_first_vote_today=True)
    assert amount == max(1, int((1 + 1) * 1.25))


def test_vote_reward_no_daily_bonus():
    amount = r.compute_vote_reward_amount(1, 1.0, is_first_vote_today=False)
    assert amount == 1


def test_apply_owns_game_bonus():
    assert r.apply_owns_game_bonus(1.25, False) == 1.25
    assert r.apply_owns_game_bonus(1.25, True) == 1.38


def test_referral_milestones_defined():
    assert r.REFERRAL_MILESTONE_100 == 100
    assert r.REFERRAL_TOP_PLAN_SLUG == "owner-network"
    assert 5 in r.REFERRAL_MILESTONES
