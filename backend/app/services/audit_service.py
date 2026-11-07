from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditEvent
from app.models.repository import ManagedRepository
from app.models.workflow import WorkflowRun


class AuditService:
    async def log_event(
        self,
        session: AsyncSession,
        user_id: str,
        event_type: str,
        description: str,
        workflow_run_id: Optional[str] = None,
        severity: str = "INFO",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        event = AuditEvent(
            user_id=user_id,
            workflow_run_id=workflow_run_id,
            event_type=event_type,
            severity=severity,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=metadata or {},
        )
        session.add(event)
        await session.commit()
        return event

    async def get_dashboard_metrics(self, session: AsyncSession, user_id: str) -> Dict[str, Any]:
        # Count workflow runs
        total_stmt = select(func.count(WorkflowRun.id)).where(WorkflowRun.user_id == user_id)
        total_runs = (await session.execute(total_stmt)).scalar() or 0

        success_stmt = select(func.count(WorkflowRun.id)).where(
            WorkflowRun.user_id == user_id, WorkflowRun.status == "SUCCESS"
        )
        successful_runs = (await session.execute(success_stmt)).scalar() or 0

        failed_stmt = select(func.count(WorkflowRun.id)).where(
            WorkflowRun.user_id == user_id, WorkflowRun.status == "FAILED"
        )
        failed_runs = (await session.execute(failed_stmt)).scalar() or 0

        partial_stmt = select(func.count(WorkflowRun.id)).where(
            WorkflowRun.user_id == user_id, WorkflowRun.status == "PARTIAL_FAILURE"
        )
        partial_failures = (await session.execute(partial_stmt)).scalar() or 0

        # Active & Deleted repositories
        active_repo_stmt = select(func.count(ManagedRepository.id)).where(
            ManagedRepository.user_id == user_id, ManagedRepository.status == "ACTIVE"
        )
        active_repos = (await session.execute(active_repo_stmt)).scalar() or 0

        deleted_repo_stmt = select(func.count(ManagedRepository.id)).where(
            ManagedRepository.user_id == user_id, ManagedRepository.status == "DELETED"
        )
        deleted_repos = (await session.execute(deleted_repo_stmt)).scalar() or 0

        success_rate = 0.0
        if total_runs > 0:
            success_rate = round((successful_runs / total_runs) * 100, 1)

        return {
            "total_executions": total_runs,
            "successful_executions": successful_runs,
            "failed_executions": failed_runs,
            "partial_failures": partial_failures,
            "success_rate_percentage": success_rate,
            "active_managed_repositories": active_repos,
            "deleted_repositories": deleted_repos,
        }

    async def get_recent_activity(self, session: AsyncSession, user_id: str, limit: int = 5) -> List[WorkflowRun]:
        stmt = (
            select(WorkflowRun)
            .where(WorkflowRun.user_id == user_id)
            .order_by(WorkflowRun.started_at.desc())
            .limit(limit)
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())


audit_service = AuditService()
