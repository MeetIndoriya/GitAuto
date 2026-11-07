from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.models.base import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.dashboard import (
    DashboardMetrics,
    DashboardSummary,
    RecentActivityItem,
)
from app.services.audit_service import audit_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=ApiResponse[DashboardSummary])
async def get_dashboard_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    metrics_data = await audit_service.get_dashboard_metrics(db, user.id)
    recent_runs = await audit_service.get_recent_activity(db, user.id, limit=5)

    recent_items = [
        RecentActivityItem(
            id=run.id,
            workflow_name=run.workflow_name,
            operation_type=run.operation_type,
            repository_name=run.repository_name,
            status=run.status,
            is_dry_run=run.is_dry_run,
            started_at=run.started_at,
            duration_ms=run.duration_ms,
        )
        for run in recent_runs
    ]

    summary = DashboardSummary(
        metrics=DashboardMetrics(**metrics_data),
        recent_activity=recent_items,
    )
    return ApiResponse(data=summary)
