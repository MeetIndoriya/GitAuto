from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.workflow import WorkflowStepResponse


class HistoryItemResponse(BaseModel):
    id: str
    workflow_name: str
    operation_type: str
    repository_name: str
    target_repository_id: Optional[str] = None
    status: str
    is_dry_run: bool
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None
    step_count: int = 0
    successful_step_count: int = 0


class HistoryDetailResponse(BaseModel):
    id: str
    workflow_name: str
    operation_type: str
    repository_name: str
    target_repository_id: Optional[str] = None
    status: str
    is_dry_run: bool
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None
    steps: List[WorkflowStepResponse] = Field(default_factory=list)
