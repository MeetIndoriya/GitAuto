from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class GitHubConnectionInfo(BaseModel):
    status: str
    scopes: List[str]
    rate_limit_remaining: int
    rate_limit_total: int
    rate_limit_reset_at: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    github_user_id: int
    github_username: str
    avatar_url: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime
    connection: Optional[GitHubConnectionInfo] = None


class GitHubLoginUrlResponse(BaseModel):
    authorization_url: str
    state: str


class GitHubTokenLoginRequest(BaseModel):
    token: str = Field(..., min_length=1, description="GitHub Personal Access Token")
