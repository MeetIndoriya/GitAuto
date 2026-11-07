import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user
from app.core.exceptions import RepositoryNotFoundException
from app.models.base import get_db, utc_now
from app.models.user import User
from app.models.workflow import WorkflowRun
from app.schemas.common import ApiResponse
from app.schemas.workflow import (
    CreateWorkflowRequest,
    WorkflowRunResponse,
    WorkflowStepResponse,
)
from app.services.auth_service import auth_service
from app.services.workflow_engine import workflow_engine

router = APIRouter(prefix="/automations", tags=["Automations"])


def _to_workflow_response(run: WorkflowRun) -> WorkflowRunResponse:
    step_responses = [
        WorkflowStepResponse(
            id=step.id,
            step_number=step.step_number,
            step_name=step.step_name,
            status=step.status,
            http_method=step.http_method,
            api_endpoint=step.api_endpoint,
            http_status_code=step.http_status_code,
            duration_ms=step.duration_ms,
            error_details=step.error_details,
            payload_snapshot=step.payload_snapshot,
            started_at=step.started_at,
            completed_at=step.completed_at,
        )
        for step in (run.steps or [])
    ]
    current_step = len([s for s in step_responses if s.status == "SUCCESS"])
    return WorkflowRunResponse(
        id=run.id,
        workflow_name=run.workflow_name,
        operation_type=run.operation_type,
        repository_name=run.repository_name,
        target_repository_id=run.target_repository_id,
        status=run.status,
        is_dry_run=run.is_dry_run,
        started_at=run.started_at,
        completed_at=run.completed_at,
        duration_ms=run.duration_ms,
        error_message=run.error_message,
        current_step=current_step,
        total_steps=len(step_responses) or 6,
        steps=step_responses,
    )


@router.post("", response_model=ApiResponse[WorkflowRunResponse], status_code=status.HTTP_201_CREATED)
async def create_automation(
    req: CreateWorkflowRequest,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    key = idempotency_key or f"wf_{user.id}_{req.repository_name}_{str(uuid.uuid4())[:8]}"
    
    # Retrieve decrypted token if live execution
    token = ""
    if not req.is_dry_run:
        _, token = await auth_service.get_user_decrypted_token(db, user.id)

    run = await workflow_engine.execute_create_repository_workflow(
        session=db,
        user=user,
        token=token,
        req=req,
        idempotency_key=key,
    )

    # Reload with steps
    stmt = (
        select(WorkflowRun)
        .where(WorkflowRun.id == run.id)
        .options(selectinload(WorkflowRun.steps))
    )
    res = await db.execute(stmt)
    full_run = res.scalars().first() or run

    return ApiResponse(data=_to_workflow_response(full_run))


@router.get("/{execution_id}", response_model=ApiResponse[WorkflowRunResponse])
async def get_automation_details(
    execution_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(WorkflowRun)
        .where(WorkflowRun.id == execution_id, WorkflowRun.user_id == user.id)
        .options(selectinload(WorkflowRun.steps))
    )
    res = await db.execute(stmt)
    run = res.scalars().first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation execution '{execution_id}' was not found.",
        )

    return ApiResponse(data=_to_workflow_response(run))


@router.post("/{execution_id}/cancel", response_model=ApiResponse[WorkflowRunResponse])
async def cancel_automation(
    execution_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(WorkflowRun)
        .where(WorkflowRun.id == execution_id, WorkflowRun.user_id == user.id)
        .options(selectinload(WorkflowRun.steps))
    )
    res = await db.execute(stmt)
    run = res.scalars().first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation execution '{execution_id}' was not found.",
        )

    if run.status in ("IN_PROGRESS", "PENDING"):
        run.status = "CANCELLED"
        run.completed_at = utc_now()
        await db.commit()
        await db.refresh(run)

    return ApiResponse(data=_to_workflow_response(run))
