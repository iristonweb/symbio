from app.db.crud.billing import NETWORK_PLAN_SLUGS, PROJECT_LIMITS, PROJECT_POOL_PLAN_SLUGS, PROMO_COSTS, SERVER_LIMITS


def test_promo_costs_defined():
    assert PROMO_COSTS["featured"] == 50
    assert PROMO_COSTS["boost"] == 30
    assert PROMO_COSTS["pinned"] == 20


def test_owner_plan_scope_sets():
    assert "owner-network" in NETWORK_PLAN_SLUGS
    assert "owner-growth" in NETWORK_PLAN_SLUGS
    assert "owner-premium" in PROJECT_POOL_PLAN_SLUGS
    assert NETWORK_PLAN_SLUGS.issubset(PROJECT_POOL_PLAN_SLUGS)


def test_owner_plan_limits_defined():
    assert PROJECT_LIMITS["owner-starter"] == 1
    assert PROJECT_LIMITS["owner-premium"] == 3
    assert PROJECT_LIMITS["owner-growth"] == 10
    assert PROJECT_LIMITS["owner-network"] is None
    assert SERVER_LIMITS["owner-network"] is None
