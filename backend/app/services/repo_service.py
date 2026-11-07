import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import (
    RepositoryNotFoundException,
    SafetyInterlockException,
)
from app.models.repository import ManagedRepository
from app.models.workflow import WorkflowRun
from app.schemas.repository import DeletionPreflightResponse
from app.services.auth_service import auth_service
from app.services.workflow_engine import workflow_engine


class RepoService:
    async def list_repositories(self, session: AsyncSession, user_id: str) -> List[ManagedRepository]:
        stmt = (
            select(ManagedRepository)
            .where(ManagedRepository.user_id == user_id)
            .order_by(ManagedRepository.created_at.desc())
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def get_repository_by_id(
        self, session: AsyncSession, user_id: str, repo_id: str
    ) -> ManagedRepository:
        stmt = (
            select(ManagedRepository)
            .where(ManagedRepository.id == repo_id, ManagedRepository.user_id == user_id)
        )
        res = await session.execute(stmt)
        repo = res.scalars().first()
        if not repo:
            raise RepositoryNotFoundException(repo_id)
        return repo

    async def preflight_deletion(
        self, session: AsyncSession, user_id: str, repo_id: str
    ) -> DeletionPreflightResponse:
        repo = await self.get_repository_by_id(session, user_id, repo_id)
        if repo.status == "DELETED":
            return DeletionPreflightResponse(
                repository_id=repo.id,
                repository_name=repo.repository_name,
                repository_full_name=repo.repository_full_name,
                github_repository_id=repo.github_repository_id,
                status=repo.status,
                safety_check_passed=False,
                message="Repository has already been marked as DELETED in GitAuto registry.",
            )

        return DeletionPreflightResponse(
            repository_id=repo.id,
            repository_name=repo.repository_name,
            repository_full_name=repo.repository_full_name,
            github_repository_id=repo.github_repository_id,
            status=repo.status,
            safety_check_passed=True,
            message="Safety preflight passed. Explicit confirmation required to proceed.",
        )

    async def delete_repository(
        self, session: AsyncSession, user_id: str, repo_id: str, confirmation_text: str
    ) -> WorkflowRun:
        repo = await self.get_repository_by_id(session, user_id, repo_id)
        
        # DOUBLE CONFIRMATION CHECK
        if confirmation_text.strip() != repo.repository_name.strip():
            raise SafetyInterlockException(
                f"Confirmation text '{confirmation_text}' does not match target repository name '{repo.repository_name}'."
            )

        if repo.status == "DELETED":
            raise SafetyInterlockException(f"Repository '{repo.repository_name}' is already deleted.")

        user, token = await auth_service.get_user_decrypted_token(session, user_id)
        idempotency_key = f"del_{repo.id}_{str(uuid.uuid4())[:8]}"

        workflow_run = await workflow_engine.execute_deletion_workflow(
            session=session,
            user=user,
            token=token,
            managed_repo=repo,
            idempotency_key=idempotency_key,
        )
        return workflow_run


repo_service = RepoService()
