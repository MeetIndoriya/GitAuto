import pytest
import pytest_asyncio
import respx
import httpx
from app.models.base import utc_now
from app.models.repository import ManagedRepository
from app.models.user import User
from app.models.workflow import WorkflowRun
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


@pytest_asyncio.fixture
async def sample_repo(db_session: AsyncSession, test_user: User) -> ManagedRepository:
    repo = ManagedRepository(
        user_id=test_user.id,
        github_repository_id=88776655,
        github_node_id="MDEwOlJlcG88776655",
        repository_name="disposable-sandbox",
        repository_full_name="octocat/disposable-sandbox",
        visibility="private",
        default_branch="main",
        status="ACTIVE",
        remote_created_at=utc_now(),
    )
    db_session.add(repo)
    await db_session.commit()
    await db_session.refresh(repo)
    return repo


@pytest.mark.asyncio
async def test_list_repositories(client: httpx.AsyncClient, auth_headers: dict, sample_repo: ManagedRepository):
    resp = await client.get("/api/v1/repositories", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1
    assert data["data"][0]["repository_name"] == "disposable-sandbox"


@pytest.mark.asyncio
async def test_deletion_preflight(client: httpx.AsyncClient, auth_headers: dict, sample_repo: ManagedRepository):
    resp = await client.get(f"/api/v1/repositories/{sample_repo.id}/preflight", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["safety_check_passed"] is True
    assert data["data"]["github_repository_id"] == 88776655


@pytest.mark.asyncio
async def test_delete_repository_mismatched_confirmation_fails(
    client: httpx.AsyncClient, auth_headers: dict, sample_repo: ManagedRepository
):
    resp = await client.post(
        f"/api/v1/repositories/{sample_repo.id}/delete",
        json={"confirmation_text": "wrong-name"},
        headers=auth_headers,
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False
    assert data["error"]["code"] == "SAFETY_INTERLOCK_VIOLATION"


@pytest.mark.asyncio
@respx.mock
async def test_delete_repository_success(
    client: httpx.AsyncClient, auth_headers: dict, sample_repo: ManagedRepository, db_session: AsyncSession
):
    # Mock remote repository assertion
    respx.get("https://api.github.com/repos/octocat/disposable-sandbox").mock(
        return_value=httpx.Response(200, json={"id": 88776655, "name": "disposable-sandbox"})
    )
    # Mock delete
    respx.delete("https://api.github.com/repos/octocat/disposable-sandbox").mock(
        return_value=httpx.Response(204)
    )

    resp = await client.post(
        f"/api/v1/repositories/{sample_repo.id}/delete",
        json={"confirmation_text": "disposable-sandbox"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["status"] == "SUCCESS"
    assert data["data"]["operation_type"] == "DELETE_REPOSITORY"

    # Verify repository status in DB is DELETED
    stmt = select(ManagedRepository).where(ManagedRepository.id == sample_repo.id)
    repo = (await db_session.execute(stmt)).scalars().first()
    assert repo.status == "DELETED"
    assert repo.remote_deleted_at is not None
