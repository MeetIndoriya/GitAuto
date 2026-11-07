from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class GitAutoException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class UnauthorizedException(GitAutoException):
    def __init__(self, message: str = "Authentication required or session expired."):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class ForbiddenAccountException(GitAutoException):
    def __init__(self, username: str):
        super().__init__(
            code="FORBIDDEN_ACCOUNT",
            message=f"Account '@{username}' is not in the authorized GitHub allowlist.",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"username": username},
        )


class RepositoryNotFoundException(GitAutoException):
    def __init__(self, repo_name: str):
        super().__init__(
            code="REPOSITORY_NOT_FOUND",
            message=f"Repository '{repo_name}' was not found in managed registry or on GitHub.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"repository_name": repo_name},
        )


class SafetyInterlockException(GitAutoException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="SAFETY_INTERLOCK_VIOLATION",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class RepositoryConflictException(GitAutoException):
    def __init__(self, repo_name: str):
        super().__init__(
            code="REPOSITORY_NAME_EXISTS",
            message=f"A repository named '{repo_name}' already exists on your GitHub account.",
            status_code=status.HTTP_409_CONFLICT,
            details={"repository_name": repo_name},
        )


class RateLimitExceededException(GitAutoException):
    def __init__(self, reset_at: Optional[str] = None, remaining: int = 0):
        super().__init__(
            code="RATE_LIMIT_EXCEEDED",
            message="GitHub API rate limit exhausted. Please wait until cooldown expires.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"reset_at": reset_at, "remaining": remaining},
        )


class GitHubApiException(GitAutoException):
    def __init__(self, status_code: int, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="GITHUB_API_ERROR",
            message=f"GitHub API returned error ({status_code}): {message}",
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details,
        )
