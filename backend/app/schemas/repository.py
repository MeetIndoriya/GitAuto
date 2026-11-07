from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ManagedRepositoryResponse(BaseModel):
    id: str
    github_repository_id: int
    github_node_id: Optional[str] = None
    repository_name: str
    repository_full_name: str
    visibility: str
    default_branch: str
    status: str
    workflow_run_id: Optional[str] = None
    remote_created_at: Optional[datetime] = None
    remote_deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class DeleteRepositoryRequest(BaseModel):
    confirmation_text: str = Field(..., description="Exact repository name typed by user to confirm destruction")


class DeletionPreflightResponse(BaseModel):
    repository_id: str
    repository_name: str
    repository_full_name: str
    github_repository_id: int
    status: str
    safety_check_passed: bool
    message: str
