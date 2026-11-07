from typing import Any, Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings as app_settings
from app.models.audit import AppSetting
from app.schemas.settings import (
    AppSettingsResponse,
    AutomationPreferences,
    RepositoryDefaults,
    UpdateSettingsRequest,
)


class SettingsService:
    async def get_settings(self, session: AsyncSession, user_id: str) -> AppSettingsResponse:
        stmt = select(AppSetting).where(AppSetting.user_id == user_id)
        res = await session.execute(stmt)
        settings_rows = {row.setting_key: row.setting_value for row in res.scalars().all()}

        repo_defaults = RepositoryDefaults(**settings_rows.get("repository_defaults", {}))
        auto_prefs = AutomationPreferences(**settings_rows.get("automation_preferences", {}))

        return AppSettingsResponse(
            repository_defaults=repo_defaults,
            automation_preferences=auto_prefs,
            authorized_user=app_settings.AUTHORIZED_GITHUB_USER,
            environment=app_settings.ENVIRONMENT,
        )

    async def update_settings(
        self, session: AsyncSession, user_id: str, req: UpdateSettingsRequest
    ) -> AppSettingsResponse:
        if req.repository_defaults is not None:
            await self._upsert_setting(
                session, user_id, "repository_defaults", req.repository_defaults.model_dump()
            )
        if req.automation_preferences is not None:
            await self._upsert_setting(
                session, user_id, "automation_preferences", req.automation_preferences.model_dump()
            )
        await session.commit()
        return await self.get_settings(session, user_id)

    async def _upsert_setting(
        self, session: AsyncSession, user_id: str, key: str, value: Dict[str, Any]
    ) -> None:
        stmt = select(AppSetting).where(AppSetting.user_id == user_id, AppSetting.setting_key == key)
        res = await session.execute(stmt)
        row = res.scalars().first()
        if row:
            row.setting_value = value
        else:
            row = AppSetting(user_id=user_id, setting_key=key, setting_value=value)
            session.add(row)


settings_service = SettingsService()
