import pytest
import pytest_asyncio
import httpx
from app.models.base import utc_now
from app.models.user import User
from app.models.workflow import WorkflowRun, WorkflowStep
from sqlalchemy.ext.asyncio import AsyncSession


@pytest_asyncio.fixture
async def sample_history(db_session: AsyncSession, test_user: User) -> WorkflowRun:
    run = WorkflowRun(
        user_id=test_user.id,
        workflow_name="Create Repository & Initialize Content",
        operation_type="CREATE_REPOSITORY",
        repository_name="history-test-repo",
        status="SUCCESS",
        idempotency_key="hist_test_key_1",
        is_dry_run=False,
        started_at=utc_now(),
        completed_at=utc_now(),
        duration_ms=2340,
    )
    db_session.add(run)
    await db_session.flush()

    step = WorkflowStep(
        workflow_run_id=run.id,
        step_number=1,
        step_name="Validate Account",
        status="SUCCESS",
        duration_ms=120,
        started_at=utc_now(),
        completed_at=utc_now(),
    )
    db_session.add(step)
    await db_session.commit()
    await db_session.refresh(run)
    return run


@pytest.mark.asyncio
async def test_get_history_list(client: httpx.AsyncClient, auth_headers: dict, sample_history: WorkflowRun):
    resp = await client.get("/api/v1/history?page=1&page_size=10", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["pagination"]["total_items"] >= 1
    assert data["data"]["items"][0]["repository_name"] == "history-test-repo"


@pytest.mark.asyncio
async def test_search_and_filter_history(
    client: httpx.AsyncClient, auth_headers: dict, sample_history: WorkflowRun
):
    # Match search
    resp = await client.get("/api/v1/history?search=history-test", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["pagination"]["total_items"] == 1

    # Non-match search
    resp = await client.get("/api/v1/history?search=nonexistent-repo", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["pagination"]["total_items"] == 0

    # Filter status SUCCESS
    resp = await client.get("/api/v1/history?status=SUCCESS", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["pagination"]["total_items"] == 1

    # Filter status FAILED
    resp = await client.get("/api/v1/history?status=FAILED", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["pagination"]["total_items"] == 0


@pytest.mark.asyncio
async def test_history_detail(client: httpx.AsyncClient, auth_headers: dict, sample_history: WorkflowRun):
    resp = await client.get(f"/api/v1/history/{sample_history.id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["id"] == sample_history.id
    assert len(data["data"]["steps"]) == 1
    assert data["data"]["steps"][0]["step_name"] == "Validate Account"


@pytest.mark.asyncio
async def test_history_export(client: httpx.AsyncClient, auth_headers: dict, sample_history: WorkflowRun):
    resp = await client.get("/api/v1/history/export", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1


@pytest.mark.asyncio
async def test_get_and_update_settings(client: httpx.AsyncClient, auth_headers: dict):
    # Get settings
    resp = await client.get("/api/v1/settings", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["repository_defaults"]["default_visibility"] == "private"

    # Patch settings
    update_payload = {
        "repository_defaults": {
            "default_visibility": "public",
            "default_branch": "develop",
            "default_gitignore": "Python",
            "default_init_readme": True,
            "naming_prefix": "ga-",
        },
        "automation_preferences": {
            "enable_dry_run_by_default": True,
            "auto_verify_commits": True,
            "request_timeout_seconds": 15.0,
            "theme_preference": "dark",
        },
    }
    patch_resp = await client.patch("/api/v1/settings", json=update_payload, headers=auth_headers)
    assert patch_resp.status_code == 200
    updated_data = patch_resp.json()
    assert updated_data["data"]["repository_defaults"]["default_visibility"] == "public"
    assert updated_data["data"]["repository_defaults"]["naming_prefix"] == "ga-"
    assert updated_data["data"]["automation_preferences"]["enable_dry_run_by_default"] is True


@pytest.mark.asyncio
async def test_health_and_readiness(client: httpx.AsyncClient):
    h_resp = await client.get("/health")
    assert h_resp.status_code == 200
    assert h_resp.json()["status"] == "healthy"

    r_resp = await client.get("/ready")
    assert r_resp.status_code == 200
    assert r_resp.json()["status"] == "ready"
