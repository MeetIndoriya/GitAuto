from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_executions: int
    successful_executions: int
    failed_executions: int
    partial_failures: int
    success_rate_percentage: float
    active_managed_repositories: int
    deleted_repositories: int


class RecentActivityItem(BaseModel):
    id: str
    workflow_name: str
    operation_type: str
    repository_name: str
    status: str
    is_dry_run: bool = False
    started_at: datetime
    duration_ms: Optional[int] = None


class DashboardSummary(BaseModel):
    metrics: DashboardMetrics
    recent_activity: List[RecentActivityItem]
