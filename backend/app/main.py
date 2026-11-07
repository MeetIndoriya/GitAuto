import sys
from pathlib import Path

# Ensure backend root directory is in sys.path
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.health import router as health_router
from app.api.v1.router import api_v1_router
from app.config import settings
from app.core.exceptions import GitAutoException
from app.core.logging import logger
from app.models.base import init_db
from app.schemas.common import ErrorDetail, ErrorResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GitAuto database schema...")
    await init_db()
    logger.info(f"GitAuto API Engine started in {settings.ENVIRONMENT} mode. Authorized user: @{settings.AUTHORIZED_GITHUB_USER}")
    yield
    logger.info("GitAuto API Engine shutting down...")


app = FastAPI(
    title="GitAuto API Engine",
    description="Production-grade GitHub Repository Lifecycle Automation API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(GitAutoException)
async def gitauto_exception_handler(request: Request, exc: GitAutoException):
    logger.warning(f"Domain exception [{exc.code}]: {exc.message}")
    err_resp = ErrorResponse(
        success=False,
        error=ErrorDetail(code=exc.code, message=exc.message, details=exc.details),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    return JSONResponse(status_code=exc.status_code, content=err_resp.model_dump())


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    raw_errors = exc.errors()
    msg = raw_errors[0].get("msg", "Validation error") if raw_errors else "Invalid request data"
    clean_errors = []
    for err in raw_errors:
        clean_errors.append({
            "loc": [str(x) for x in err.get("loc", [])],
            "msg": str(err.get("msg", "")),
            "type": str(err.get("type", "")),
        })
    err_resp = ErrorResponse(
        success=False,
        error=ErrorDetail(code="VALIDATION_ERROR", message=msg, details={"errors": clean_errors}),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=err_resp.model_dump())


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    err_resp = ErrorResponse(
        success=False,
        error=ErrorDetail(code="HTTP_ERROR", message=str(exc.detail)),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    return JSONResponse(status_code=exc.status_code, content=err_resp.model_dump())


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error: {str(exc)}")
    err_resp = ErrorResponse(
        success=False,
        error=ErrorDetail(code="INTERNAL_SERVER_ERROR", message="An unexpected error occurred processing your request."),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=err_resp.model_dump())


# Mount Routers
app.include_router(health_router)
app.include_router(api_v1_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)

