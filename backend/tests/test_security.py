import pytest
from fastapi.testclient import TestClient

from backend.app.main import create_app


@pytest.mark.parametrize("path", ["/api/contributions", "/missing"])
def test_security_headers(path):
    with TestClient(create_app()) as client:
        response = client.get(path)

    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "no-referrer"


def test_configured_host_allowlist(monkeypatch):
    monkeypatch.setenv("APP_ALLOWED_HOSTS", "api.example.org,127.0.0.1")
    with TestClient(create_app()) as client:
        rejected = client.get("/api/contributions", headers={"Host": "attacker.test"})
        accepted = client.get("/api/contributions", headers={"Host": "api.example.org"})
        local = client.get("/api/contributions", headers={"Host": "127.0.0.1:8000"})

    assert rejected.status_code == 400
    assert rejected.headers["X-Content-Type-Options"] == "nosniff"
    assert accepted.status_code == local.status_code == 200


def test_disable_docs(monkeypatch):
    monkeypatch.setenv("APP_EXPOSE_API_DOCS", "false")
    with TestClient(create_app()) as client:
        for path in ("/docs", "/docs/oauth2-redirect", "/redoc", "/openapi.json"):
            assert client.get(path).status_code == 404
        assert client.get("/api/contributions").status_code == 200
