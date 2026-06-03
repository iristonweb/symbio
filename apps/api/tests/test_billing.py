from app.db.crud.billing import PROMO_COSTS


def test_promo_costs_defined():
    assert PROMO_COSTS["featured"] == 50
    assert PROMO_COSTS["boost"] == 30
    assert PROMO_COSTS["pinned"] == 20
