from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.automations import router as automations_router
from app.api.v1.repositories import router as repositories_router
from app.api.v1.history import router as history_router
from app.api.v1.settings import router as settings_router
from app.api.v1.health import router as health_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(automations_router)
api_v1_router.include_router(repositories_router)
api_v1_router.include_router(history_router)
api_v1_router.include_router(settings_router)
