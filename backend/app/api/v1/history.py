import math
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user
from app.models.base import get_db
from app.models.user import User
from app.models.workflow import WorkflowRun, WorkflowStep
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.history import HistoryDetailResponse, HistoryItemResponse
from app.schemas.workflow import WorkflowStepResponse

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=ApiResponse[PaginatedResponse[HistoryItemResponse]])
async def list_history(
    search: Optional[str] = Query(default=None, description="Search by repository name or execution ID"),
    status: Optional[str] = Query(default=None, description="Filter by status (SUCCESS, FAILED, PARTIAL_FAILURE, IN_PROGRESS)"),
    operation_type: Optional[str] = Query(default=None, description="Filter by operation type"),
    sort_by: str = Query(default="newest", description="Sort order: 'newest' or 'oldest'"),
    from_date: Optional[str] = Query(default=None, description="ISO start date filter"),
    to_date: Optional[str] = Query(default=None, description="ISO end date filter"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(WorkflowRun).where(WorkflowRun.user_id == user.id)
    count_query = select(func.count(WorkflowRun.id)).where(WorkflowRun.user_id == user.id)

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        search_filter = or_(
            WorkflowRun.repository_name.ilike(term),
            WorkflowRun.id.ilike(term),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Status filter
    if status and status.strip():
        query = query.where(WorkflowRun.status == status.strip().upper())
        count_query = count_query.where(WorkflowRun.status == status.strip().upper())

    # Operation type filter
    if operation_type and operation_type.strip():
        query = query.where(WorkflowRun.operation_type == operation_type.strip().upper())
        count_query = count_query.where(WorkflowRun.operation_type == operation_type.strip().upper())

    # Date filters
    if from_date:
        try:
            dt_from = datetime.fromisoformat(from_date.replace("Z", "+00:00"))
            query = query.where(WorkflowRun.started_at >= dt_from)
            count_query = count_query.where(WorkflowRun.started_at >= dt_from)
        except Exception:
            pass

    if to_date:
        try:
            dt_to = datetime.fromisoformat(to_date.replace("Z", "+00:00"))
            query = query.where(WorkflowRun.started_at <= dt_to)
            count_query = count_query.where(WorkflowRun.started_at <= dt_to)
        except Exception:
            pass

    # Total count
    total_items = (await db.execute(count_query)).scalar() or 0

    # Sorting
    if sort_by == "oldest":
        query = query.order_by(WorkflowRun.started_at.asc())
    else:
        query = query.order_by(WorkflowRun.started_at.desc())

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).options(selectinload(WorkflowRun.steps))

    runs = (await db.execute(query)).scalars().all()
    total_pages = math.ceil(total_items / page_size) if total_items > 0 else 1

    items = []
    for run in runs:
        steps = run.steps or []
        items.append(
            HistoryItemResponse(
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
                step_count=len(steps),
                successful_step_count=len([s for s in steps if s.status == "SUCCESS"]),
            )
        )

    pagination = PaginationMeta(
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
        has_next=(page < total_pages),
        has_prev=(page > 1),
    )

    return ApiResponse(data=PaginatedResponse(items=items, pagination=pagination))


@router.get("/export", response_model=ApiResponse[List[HistoryDetailResponse]])
async def export_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(WorkflowRun)
        .where(WorkflowRun.user_id == user.id)
        .order_by(WorkflowRun.started_at.desc())
        .options(selectinload(WorkflowRun.steps))
    )
    runs = (await db.execute(stmt)).scalars().all()

    result = []
    for run in runs:
        step_dtos = [
            WorkflowStepResponse(
                id=s.id,
                step_number=s.step_number,
                step_name=s.step_name,
                status=s.status,
                http_method=s.http_method,
                api_endpoint=s.api_endpoint,
                http_status_code=s.http_status_code,
                duration_ms=s.duration_ms,
                error_details=s.error_details,
                payload_snapshot=s.payload_snapshot,
                started_at=s.started_at,
                completed_at=s.completed_at,
            )
            for s in (run.steps or [])
        ]
        result.append(
            HistoryDetailResponse(
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
                steps=step_dtos,
            )
        )

    return ApiResponse(data=result)


@router.get("/{execution_id}", response_model=ApiResponse[HistoryDetailResponse])
async def get_history_detail(
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
            detail=f"Execution history record '{execution_id}' was not found.",
        )

    step_dtos = [
        WorkflowStepResponse(
            id=s.id,
            step_number=s.step_number,
            step_name=s.step_name,
            status=s.status,
            http_method=s.http_method,
            api_endpoint=s.api_endpoint,
            http_status_code=s.http_status_code,
            duration_ms=s.duration_ms,
            error_details=s.error_details,
            payload_snapshot=s.payload_snapshot,
            started_at=s.started_at,
            completed_at=s.completed_at,
        )
        for s in (run.steps or [])
    ]

    detail = HistoryDetailResponse(
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
        steps=step_dtos,
    )
    return ApiResponse(data=detail)
