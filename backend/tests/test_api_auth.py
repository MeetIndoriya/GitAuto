import json
import pytest
import respx
import httpx
from app.config import settings
from app.core.security import encrypt_token


@pytest.mark.asyncio
async def test_github_login_redirect(client: httpx.AsyncClient):
    resp = await client.get("/api/v1/auth/github/login?format=redirect", follow_redirects=False)
    assert resp.status_code == 302
    assert "https://github.com/login/oauth/authorize" in resp.headers["location"]
    assert "gitauto_pkce" in resp.headers.get("set-cookie", "")


@pytest.mark.asyncio
async def test_github_login_json(client: httpx.AsyncClient):
    resp = await client.get("/api/v1/auth/github/login?format=json")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "https://github.com/login/oauth/authorize" in data["data"]["authorization_url"]
    assert "state" in data["data"]


@pytest.mark.asyncio
@respx.mock
async def test_github_callback_success_authorized_user(client: httpx.AsyncClient):
    # Mock token exchange
    respx.post("https://github.com/login/oauth/access_token").mock(
        return_value=httpx.Response(200, json={"access_token": "ghp_mock_token_123", "scope": "repo,read:user,user:email"})
    )
    # Mock user profile
    test_login = (settings.AUTHORIZED_GITHUB_USER or "octocat").split(",")[0]
    respx.get("https://api.github.com/user").mock(
        return_value=httpx.Response(200, json={"id": 99999, "login": test_login, "avatar_url": "https://avatar.png", "email": "octocat@github.com"})
    )

    state = "test_state_123"
    pkce_cookie = encrypt_token(json.dumps({"state": state, "code_verifier": "test_verifier"}))

    client.cookies.set("gitauto_pkce", pkce_cookie)
    resp = await client.get(f"/api/v1/auth/github/callback?code=mock_code&state={state}", follow_redirects=False)

    assert resp.status_code == 302
    assert "/dashboard" in resp.headers["location"]
    assert settings.SESSION_COOKIE_NAME in resp.headers.get("set-cookie", "")


@pytest.mark.asyncio
@respx.mock
async def test_github_callback_rejects_unauthorized_user(client: httpx.AsyncClient, monkeypatch):
    monkeypatch.setattr(settings, "AUTHORIZED_GITHUB_USER", "allowed_user")
    # Mock token exchange
    respx.post("https://github.com/login/oauth/access_token").mock(
        return_value=httpx.Response(200, json={"access_token": "ghp_mock_token_123", "scope": "repo,read:user"})
    )
    # Mock user profile with unauthorized user
    respx.get("https://api.github.com/user").mock(
        return_value=httpx.Response(200, json={"id": 88888, "login": "attacker_user", "avatar_url": "https://avatar.png"})
    )

    state = "test_state_unauth"
    pkce_cookie = encrypt_token(json.dumps({"state": state, "code_verifier": "test_verifier"}))

    client.cookies.set("gitauto_pkce", pkce_cookie)
    resp = await client.get(f"/api/v1/auth/github/callback?code=mock_code&state={state}", follow_redirects=False)

    assert resp.status_code == 302
    assert "error=unauthorized_account" in resp.headers["location"]


@pytest.mark.asyncio
@respx.mock
async def test_auth_me_endpoint(client: httpx.AsyncClient, auth_headers: dict):
    respx.get("https://api.github.com/rate_limit").mock(
        return_value=httpx.Response(200, json={"resources": {"core": {"limit": 5000, "remaining": 4950, "reset": 1700000000}}})
    )

    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["github_username"] == "octocat"
    assert data["data"]["connection"]["status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_auth_me_unauthorized(client: httpx.AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    assert resp.json()["success"] is False
    assert resp.json()["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
@respx.mock
async def test_github_token_login_success(client: httpx.AsyncClient):
    respx.get("https://api.github.com/user").mock(
        return_value=httpx.Response(
            200,
            headers={"x-oauth-scopes": "repo,read:user,user:email"},
            json={
                "id": 1234567,
                "login": "octocat",
                "avatar_url": "https://avatar.png",
                "email": "octocat@github.com",
            },
        )
    )

    resp = await client.post("/api/v1/auth/github-token", json={"token": "ghp_valid_test_token_123"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["github_username"] == "octocat"
    assert settings.SESSION_COOKIE_NAME in resp.headers.get("set-cookie", "")


@pytest.mark.asyncio
@respx.mock
async def test_github_token_login_invalid(client: httpx.AsyncClient):
    respx.get("https://api.github.com/user").mock(
        return_value=httpx.Response(401, json={"message": "Bad credentials"})
    )

    resp = await client.post("/api/v1/auth/github-token", json={"token": "ghp_invalid_token"})
    assert resp.status_code == 401
    assert "Invalid or expired" in resp.json()["error"]["message"]

