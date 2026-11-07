from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.models.base import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.settings import (
    AppSettingsResponse,
    UpdateSettingsRequest,
)
from app.services.settings_service import settings_service

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=ApiResponse[AppSettingsResponse])
async def get_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings_data = await settings_service.get_settings(db, user.id)
    return ApiResponse(data=settings_data)


@router.patch("", response_model=ApiResponse[AppSettingsResponse])
async def update_settings(
    req: UpdateSettingsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await settings_service.update_settings(db, user.id, req)
    return ApiResponse(data=updated)
