import re
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


class CreateWorkflowRequest(BaseModel):
    repository_name: str = Field(..., min_length=1, max_length=100, description="GitHub repository name")
    description: Optional[str] = Field(default="", max_length=350, description="Repository description")
    visibility: Literal["public", "private"] = Field(default="private", description="Repository visibility")
    default_branch: str = Field(default="main", min_length=1, max_length=50, description="Default branch name")
    init_readme: bool = Field(default=True, description="Whether to scaffold README.md")
    readme_template: Optional[str] = Field(default=None, description="Custom README.md markdown content")
    gitignore_template: Optional[str] = Field(default="Node", description="Language template for .gitignore (Node, Python, Go, Rust, None)")
    license_template: Optional[str] = Field(default=None, description="Optional license template")
    is_dry_run: bool = Field(default=False, description="Preview mode without making remote changes")
    auto_delete: bool = Field(default=False, description="Automatically delete repository after pushing commits to clean up while recording contributions")
    commits_count: int = Field(default=1, ge=1, le=50, description="Number of contribution commits to push")
    commits_per_day: Optional[int] = Field(default=1, ge=1, le=10, description="Commits per scheduled date")
    start_date: Optional[str] = Field(default=None, description="Start date for scheduled contributions (YYYY-MM-DD)")
    end_date: Optional[str] = Field(default=None, description="End date for scheduled contributions (YYYY-MM-DD)")
    repo_prefix: Optional[str] = Field(default=None, description="Prefix for generated repository name")

    @field_validator("repository_name")
    @classmethod
    def validate_repository_name(cls, v: str) -> str:
        name = v.strip()
        if not name:
            raise ValueError("Repository name cannot be empty.")
        if name in (".", ".."):
            raise ValueError("Repository name cannot be '.' or '..'.")
        # GitHub allows alphanumeric, hyphens, periods, and underscores
        if not re.match(r"^[a-zA-Z0-9_\-\.]+$", name):
            raise ValueError("Repository name can only contain alphanumeric characters, hyphens, periods, and underscores.")
        if name.startswith(".") or name.startswith("-") or name.endswith(".") or name.endswith("-"):
            raise ValueError("Repository name cannot begin or end with a period or hyphen.")
        return name


class WorkflowStepResponse(BaseModel):
    id: str
    step_number: int
    step_name: str
    status: str
    http_method: Optional[str] = None
    api_endpoint: Optional[str] = None
    http_status_code: Optional[int] = None
    duration_ms: Optional[int] = None
    error_details: Optional[str] = None
    payload_snapshot: Optional[Dict[str, Any]] = None
    started_at: datetime
    completed_at: Optional[datetime] = None


class WorkflowRunResponse(BaseModel):
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
    current_step: int = 0
    total_steps: int = 0
    steps: List[WorkflowStepResponse] = Field(default_factory=list)
