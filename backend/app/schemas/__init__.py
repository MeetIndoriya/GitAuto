from app.schemas.common import (
    ApiResponse,
    ErrorDetail,
    ErrorResponse,
    PaginationMeta,
    PaginatedResponse,
)
from app.schemas.auth import (
    GitHubConnectionInfo,
    UserProfile,
    GitHubLoginUrlResponse,
)
from app.schemas.dashboard import (
    DashboardMetrics,
    RecentActivityItem,
    DashboardSummary,
)
from app.schemas.workflow import (
    CreateWorkflowRequest,
    WorkflowStepResponse,
    WorkflowRunResponse,
)
from app.schemas.repository import (
    ManagedRepositoryResponse,
    DeleteRepositoryRequest,
    DeletionPreflightResponse,
)
from app.schemas.history import (
    HistoryItemResponse,
    HistoryDetailResponse,
)
from app.schemas.settings import (
    RepositoryDefaults,
    AutomationPreferences,
    AppSettingsResponse,
    UpdateSettingsRequest,
)

__all__ = [
    "ApiResponse",
    "ErrorDetail",
    "ErrorResponse",
    "PaginationMeta",
    "PaginatedResponse",
    "GitHubConnectionInfo",
    "UserProfile",
    "GitHubLoginUrlResponse",
    "DashboardMetrics",
    "RecentActivityItem",
    "DashboardSummary",
    "CreateWorkflowRequest",
    "WorkflowStepResponse",
    "WorkflowRunResponse",
    "ManagedRepositoryResponse",
    "DeleteRepositoryRequest",
    "DeletionPreflightResponse",
    "HistoryItemResponse",
    "HistoryDetailResponse",
    "RepositoryDefaults",
    "AutomationPreferences",
    "AppSettingsResponse",
    "UpdateSettingsRequest",
]
