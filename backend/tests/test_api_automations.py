import pytest
import respx
import httpx
from app.models.repository import ManagedRepository
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_create_automation_dry_run(client: httpx.AsyncClient, auth_headers: dict):
    payload = {
        "repository_name": "sandbox-preview-app",
        "description": "Preview dry run test",
        "visibility": "private",
        "default_branch": "main",
        "init_readme": True,
        "gitignore_template": "Node",
        "is_dry_run": True,
    }
    resp = await client.post("/api/v1/automations", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["status"] == "SUCCESS"
    assert data["data"]["is_dry_run"] is True
    assert len(data["data"]["steps"]) == 6


@pytest.mark.asyncio
@respx.mock
async def test_create_automation_live_success(client: httpx.AsyncClient, auth_headers: dict, db_session: AsyncSession):
    # 1. Profile
    respx.get("https://api.github.com/user").mock(
        return_value=httpx.Response(200, json={"login": "octocat", "id": 123456})
    )
    # 2. Create repo
    respx.post("https://api.github.com/user/repos").mock(
        return_value=httpx.Response(201, json={
            "id": 987654321,
            "node_id": "MDEwOlJlcG9zaXRvcnk5ODc2NTQzMjE=",
            "name": "my-automated-repo",
            "full_name": "octocat/my-automated-repo",
            "private": True,
            "html_url": "https://github.com/octocat/my-automated-repo",
            "visibility": "private"
        })
    )
    # 3. Put README.md
    respx.put("https://api.github.com/repos/octocat/my-automated-repo/contents/README.md").mock(
        return_value=httpx.Response(201, json={"content": {"name": "README.md", "sha": "abc123readme"}})
    )
    # 4. Put .gitignore
    respx.put("https://api.github.com/repos/octocat/my-automated-repo/contents/.gitignore").mock(
        return_value=httpx.Response(201, json={"content": {"name": ".gitignore", "sha": "def456gitignore"}})
    )
    # 5. Verify branch
    respx.get("https://api.github.com/repos/octocat/my-automated-repo/branches/main").mock(
        return_value=httpx.Response(200, json={"name": "main", "commit": {"sha": "9f8e7d6c5b4a"}})
    )

    payload = {
        "repository_name": "my-automated-repo",
        "description": "Live production scaffold",
        "visibility": "private",
        "default_branch": "main",
        "init_readme": True,
        "gitignore_template": "Node",
        "is_dry_run": False,
    }
    resp = await client.post("/api/v1/automations", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["status"] == "RUNNING_FOREVER"
    assert data["data"]["repository_name"] == "my-automated-repo"

    # Verify repository is registered in DB
    stmt = select(ManagedRepository).where(ManagedRepository.repository_name == "my-automated-repo")
    repo = (await db_session.execute(stmt)).scalars().first()
    assert repo is not None
    assert repo.github_repository_id == 987654321
    assert repo.status == "ACTIVE"


@pytest.mark.asyncio
@respx.mock
async def test_create_automation_partial_failure_preserves_repo(
    client: httpx.AsyncClient, auth_headers: dict, db_session: AsyncSession
):
    # 1. Profile
    respx.get("https://api.github.com/user").mock(
        return_value=httpx.Response(200, json={"login": "octocat", "id": 123456})
    )
    # 2. Create repo succeeds
    respx.post("https://api.github.com/user/repos").mock(
        return_value=httpx.Response(201, json={
            "id": 11223344,
            "node_id": "MDEwOlJlcG11223344",
            "name": "partial-fail-repo",
            "full_name": "octocat/partial-fail-repo",
            "private": True,
            "html_url": "https://github.com/octocat/partial-fail-repo",
            "visibility": "private"
        })
    )
    # 3. Content push fails with 500
    respx.put("https://api.github.com/repos/octocat/partial-fail-repo/contents/README.md").mock(
        return_value=httpx.Response(500, text="Internal GitHub Error")
    )
    # Assert DELETE endpoint is NEVER called
    delete_route = respx.delete("https://api.github.com/repos/octocat/partial-fail-repo")

    payload = {
        "repository_name": "partial-fail-repo",
        "description": "Fails during content push",
        "visibility": "private",
        "default_branch": "main",
        "init_readme": True,
        "is_dry_run": False,
    }
    resp = await client.post("/api/v1/automations", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["data"]["status"] == "PARTIAL_FAILURE"
    assert "content scaffolding failed" in data["data"]["error_message"]

    # Verify DELETE was NOT called
    assert not delete_route.called

    # Verify repo is in PARTIAL_FAILURE status in DB and not deleted
    stmt = select(ManagedRepository).where(ManagedRepository.repository_name == "partial-fail-repo")
    repo = (await db_session.execute(stmt)).scalars().first()
    assert repo is not None
    assert repo.status == "PARTIAL_FAILURE"


@pytest.mark.asyncio
async def test_create_automation_invalid_repo_name(client: httpx.AsyncClient, auth_headers: dict):
    payload = {
        "repository_name": "invalid name with spaces",
        "visibility": "private",
    }
    resp = await client.post("/api/v1/automations", json=payload, headers=auth_headers)
    assert resp.status_code == 422
    assert resp.json()["success"] is False
