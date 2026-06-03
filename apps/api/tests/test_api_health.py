from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["version"] == "0.2.0"


def test_openapi():
    r = client.get("/openapi.json")
    assert r.status_code == 200
    paths = r.json().get("paths", {})
    assert "/games" in paths
    assert "/billing/plans" in paths
