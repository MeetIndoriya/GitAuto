from typing import AsyncGenerator, Optional
from fastapi import Cookie, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.core.exceptions import UnauthorizedException
from app.core.security import verify_session_jwt
from app.models.base import get_db
from app.models.user import User
from app.services.auth_service import auth_service


async def get_current_user_optional(
    request: Request,
    gitauto_session: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    token = gitauto_session
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization[7:]

    if not token:
        return None

    payload = verify_session_jwt(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = await auth_service.get_user_by_id(db, user_id)
    return user


async def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    if not user:
        raise UnauthorizedException("Authentication required. Please log in.")
    return user
