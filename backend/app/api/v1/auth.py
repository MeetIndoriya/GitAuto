import json
from typing import Any, Dict, Optional
from urllib.parse import urlencode
import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.config import settings
from app.core.exceptions import ForbiddenAccountException, UnauthorizedException
from app.core.logging import logger
from app.core.security import (
    create_session_jwt,
    decrypt_token,
    encrypt_token,
    generate_oauth_state,
    generate_pkce_pair,
)
from app.integrations.github_client import github_client
from app.models.base import get_db
from app.models.user import User
from app.schemas.auth import (
    GitHubConnectionInfo,
    GitHubLoginUrlResponse,
    GitHubTokenLoginRequest,
    UserProfile,
)
from app.schemas.common import ApiResponse
from app.services.audit_service import audit_service
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/github/login")
async def github_login(
    request: Request,
    response: Response,
    format: str = Query(default="redirect", description="Response format: 'redirect' or 'json'"),
):
    code_verifier, code_challenge = generate_pkce_pair()
    raw_state = generate_oauth_state()

    host = request.headers.get("host", "")
    is_local = "localhost" in host or "127.0.0.1" in host
    state = f"local_{raw_state}" if is_local else raw_state

    # Package state and verifier in encrypted cookie
    pkce_payload = json.dumps({"state": raw_state, "code_verifier": code_verifier})
    encrypted_pkce = encrypt_token(pkce_payload)

    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": settings.GITHUB_REDIRECT_URI,
        "scope": "repo,read:user,user:email",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "response_type": "code",
    }
    github_auth_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"

    if format == "json":
        res = ApiResponse(data=GitHubLoginUrlResponse(authorization_url=github_auth_url, state=state))
        resp = Response(content=res.model_dump_json(), media_type="application/json")
        resp.set_cookie(
            key="gitauto_pkce",
            value=encrypted_pkce,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=600,  # 10 minutes
        )
        return resp

    redirect_resp = RedirectResponse(url=github_auth_url, status_code=status.HTTP_302_FOUND)
    redirect_resp.set_cookie(
        key="gitauto_pkce",
        value=encrypted_pkce,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=600,
    )
    return redirect_resp


@router.get("/github/callback")
async def github_callback(
    request: Request,
    response: Response,
    code: Optional[str] = Query(default=None),
    state: Optional[str] = Query(default=None),
    error: Optional[str] = Query(default=None),
    error_description: Optional[str] = Query(default=None),
    gitauto_pkce: Optional[str] = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    if error:
        redirect_url = f"{settings.FRONTEND_URL}/login?error={error}&description={error_description or ''}"
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)

    if not code or not state:
        redirect_url = f"{settings.FRONTEND_URL}/login?error=invalid_callback_params"
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)

    check_state = state.replace("local_", "") if state else ""
    code_verifier = ""
    if gitauto_pkce:
        try:
            decrypted = decrypt_token(gitauto_pkce)
            pkce_data = json.loads(decrypted)
            saved_state = pkce_data.get("state")
            if saved_state != check_state:
                logger.warning(f"OAuth state mismatch: expected {saved_state}, got {check_state}")
                redirect_url = f"{settings.FRONTEND_URL}/login?error=state_mismatch"
                return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
            code_verifier = pkce_data.get("code_verifier", "")
        except Exception as e:
            logger.error(f"Failed to decrypt PKCE cookie: {str(e)}")

    try:
        # 1. Exchange code for access token
        token_data = await github_client.exchange_oauth_code(code, code_verifier)
        access_token = token_data.get("access_token")
        if not access_token:
            redirect_url = f"{settings.FRONTEND_URL}/login?error=token_exchange_failed"
            return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)

        # 2. Get GitHub user profile
        profile = await github_client.get_user_profile(access_token)

        # 3. Authenticate with allowlist
        user = await auth_service.authenticate_github_user(
            session=db,
            gh_profile=profile,
            access_token=access_token,
            token_scope=token_data.get("scope", "repo,read:user,user:email"),
            enforce_allowlist=True,
        )

        # 4. Generate Session JWT
        session_jwt = create_session_jwt(user.id, user.github_username)

        # 5. Log audit event
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        await audit_service.log_event(
            session=db,
            user_id=user.id,
            event_type="AUTH_LOGIN",
            description=f"User @{user.github_username} logged in successfully.",
            severity="INFO",
            ip_address=client_ip,
            user_agent=user_agent,
        )

        # 6. Redirect to frontend dashboard with session cookie
        dashboard_url = f"{settings.FRONTEND_URL}/dashboard"
        resp = RedirectResponse(url=dashboard_url, status_code=status.HTTP_302_FOUND)
        resp.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=session_jwt,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAME_SITE,
            max_age=settings.SESSION_MAX_AGE_DAYS * 86400,
            path="/",
        )
        resp.delete_cookie(key="gitauto_pkce")
        return resp

    except ForbiddenAccountException as fae:
        logger.warning(f"Forbidden login attempt by: {fae.details.get('username')}")
        redirect_url = f"{settings.FRONTEND_URL}/login?error=unauthorized_account&username={fae.details.get('username', '')}"
        resp = RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
        resp.delete_cookie(key=settings.SESSION_COOKIE_NAME)
        resp.delete_cookie(key="gitauto_pkce")
        return resp
    except Exception as e:
        logger.exception("GitHub OAuth callback error")
        redirect_url = f"{settings.FRONTEND_URL}/login?error=auth_error&message={str(e)}"
        resp = RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
        resp.delete_cookie(key="gitauto_pkce")
        return resp


@router.post("/github-token", response_model=ApiResponse[UserProfile])
async def login_with_github_token(
    payload: GitHubTokenLoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    token = payload.token.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub Authorization Token is required.",
        )

    # Directly validate token and fetch identity from GitHub API
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            gh_resp = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "GitAuto-Engine/1.0",
                },
            )
    except Exception as e:
        logger.error(f"GitHub API connection failure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach GitHub API. Please check your internet connection and try again.",
        )

    if gh_resp.status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired GitHub Token. Authentication failed on GitHub.",
        )

    if gh_resp.status_code == 403:
        err_data = gh_resp.json() if gh_resp.headers.get("content-type", "").startswith("application/json") else {}
        err_msg = err_data.get("message", "GitHub rate limit exceeded or access forbidden.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"GitHub Authorization rejected: {err_msg}",
        )

    if not gh_resp.is_success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GitHub API error ({gh_resp.status_code}). Please verify your token.",
        )

    gh_profile = gh_resp.json()
    scopes = gh_resp.headers.get("x-oauth-scopes", "")

    # For classic personal access tokens, verify repo permission is present
    if "x-oauth-scopes" in gh_resp.headers:
        scopes_list = [s.strip() for s in scopes.split(",") if s.strip()]
        if "repo" not in scopes_list:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="GitHub Token is missing the required 'repo' scope. Please create a Personal Access Token with 'repo' scope enabled.",
            )

    # Upsert user and encrypted token
    user = await auth_service.authenticate_github_user(
        session=db,
        gh_profile=gh_profile,
        access_token=token,
        token_scope=scopes or "repo,read:user,user:email",
        enforce_allowlist=False,
    )

    # Generate Session JWT
    session_jwt = create_session_jwt(user.id, user.github_username)

    # Audit log event
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    await audit_service.log_event(
        session=db,
        user_id=user.id,
        event_type="AUTH_LOGIN",
        description=f"User @{user.github_username} authenticated via GitHub Token Authorization.",
        severity="INFO",
        ip_address=client_ip,
        user_agent=user_agent,
    )

    # Set HTTP-only session cookie
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_jwt,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAME_SITE,
        max_age=settings.SESSION_MAX_AGE_DAYS * 86400,
        path="/",
    )

    profile = UserProfile(
        id=user.id,
        github_user_id=user.github_user_id,
        github_username=user.github_username,
        avatar_url=user.avatar_url,
        email=user.email,
        created_at=user.created_at,
        connection=None,
    )
    return ApiResponse(data=profile)


@router.get("/me", response_model=ApiResponse[UserProfile])
async def get_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    connection_info = None
    try:
        _, token = await auth_service.get_user_decrypted_token(db, user.id)
        limits = await github_client.check_rate_limit(token)
        connection_info = GitHubConnectionInfo(
            status="ACTIVE",
            scopes=["repo", "read:user", "user:email"],
            rate_limit_remaining=limits.get("remaining", 5000),
            rate_limit_total=limits.get("limit", 5000),
            rate_limit_reset_at=limits.get("reset_at"),
        )
    except Exception as e:
        connection_info = GitHubConnectionInfo(
            status="WARNING",
            scopes=["repo", "read:user", "user:email"],
            rate_limit_remaining=5000,
            rate_limit_total=5000,
            rate_limit_reset_at=None,
        )

    profile = UserProfile(
        id=user.id,
        github_user_id=user.github_user_id,
        github_username=user.github_username,
        avatar_url=user.avatar_url,
        email=user.email,
        created_at=user.created_at,
        connection=connection_info,
    )
    return ApiResponse(data=profile)


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host if request.client else None
    await audit_service.log_event(
        session=db,
        user_id=user.id,
        event_type="AUTH_LOGOUT",
        description=f"User @{user.github_username} logged out.",
        severity="INFO",
        ip_address=client_ip,
    )
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")
    return {"success": True, "message": "Successfully logged out."}
