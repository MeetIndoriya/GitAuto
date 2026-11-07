from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "GitAuto API Engine",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT,
    }


@router.get("/ready")
async def readiness_check():
    return {
        "status": "ready",
        "service": "GitAuto API Engine",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
