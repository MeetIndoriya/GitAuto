from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user
from app.models.base import get_db
from app.models.repository import ManagedRepository
from app.models.user import User
from app.models.workflow import WorkflowRun
from app.schemas.common import ApiResponse
from app.schemas.repository import (
    DeleteRepositoryRequest,
    DeletionPreflightResponse,
    ManagedRepositoryResponse,
)
from app.schemas.workflow import WorkflowRunResponse
from app.services.repo_service import repo_service
from app.api.v1.automations import _to_workflow_response

router = APIRouter(prefix="/repositories", tags=["Repositories"])


def _to_repo_response(repo: ManagedRepository) -> ManagedRepositoryResponse:
    return ManagedRepositoryResponse(
        id=repo.id,
        github_repository_id=repo.github_repository_id,
        github_node_id=repo.github_node_id,
        repository_name=repo.repository_name,
        repository_full_name=repo.repository_full_name,
        visibility=repo.visibility,
        default_branch=repo.default_branch,
        status=repo.status,
        workflow_run_id=repo.workflow_run_id,
        remote_created_at=repo.remote_created_at,
        remote_deleted_at=repo.remote_deleted_at,
        created_at=repo.created_at,
        updated_at=repo.updated_at,
    )


@router.get("", response_model=ApiResponse[List[ManagedRepositoryResponse]])
async def list_repositories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repos = await repo_service.list_repositories(db, user.id)
    return ApiResponse(data=[_to_repo_response(r) for r in repos])


@router.get("/{repo_id}", response_model=ApiResponse[ManagedRepositoryResponse])
async def get_repository(
    repo_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = await repo_service.get_repository_by_id(db, user.id, repo_id)
    return ApiResponse(data=_to_repo_response(repo))


@router.get("/{repo_id}/preflight", response_model=ApiResponse[DeletionPreflightResponse])
async def preflight_repository_deletion(
    repo_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    preflight = await repo_service.preflight_deletion(db, user.id, repo_id)
    return ApiResponse(data=preflight)


@router.post("/{repo_id}/delete", response_model=ApiResponse[WorkflowRunResponse])
async def delete_repository(
    repo_id: str,
    req: DeleteRepositoryRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workflow_run = await repo_service.delete_repository(
        session=db,
        user_id=user.id,
        repo_id=repo_id,
        confirmation_text=req.confirmation_text,
    )
    stmt = (
        select(WorkflowRun)
        .where(WorkflowRun.id == workflow_run.id)
        .options(selectinload(WorkflowRun.steps))
    )
    res = await db.execute(stmt)
    full_run = res.scalars().first() or workflow_run
    return ApiResponse(data=_to_workflow_response(full_run))
