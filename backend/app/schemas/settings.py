from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, Field


class RepositoryDefaults(BaseModel):
    default_visibility: Literal["public", "private"] = "private"
    default_branch: str = "main"
    default_gitignore: str = "Node"
    default_init_readme: bool = True
    naming_prefix: str = ""


class AutomationPreferences(BaseModel):
    enable_dry_run_by_default: bool = False
    auto_verify_commits: bool = True
    request_timeout_seconds: float = 10.0
    theme_preference: Literal["system", "dark", "light"] = "dark"


class AppSettingsResponse(BaseModel):
    repository_defaults: RepositoryDefaults
    automation_preferences: AutomationPreferences
    authorized_user: Optional[str] = ""
    environment: str


class UpdateSettingsRequest(BaseModel):
    repository_defaults: Optional[RepositoryDefaults] = None
    automation_preferences: Optional[AutomationPreferences] = None
