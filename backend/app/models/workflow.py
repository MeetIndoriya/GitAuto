from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, gen_uuid_str, utc_now


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid_str, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    workflow_name: Mapped[str] = mapped_column(String(100), nullable=False)
    operation_type: Mapped[str] = mapped_column(String(50), nullable=False)  # CREATE_REPOSITORY, DELETE_REPOSITORY, RETRY_SCAFFOLD
    repository_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    target_repository_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", index=True)  # PENDING, IN_PROGRESS, SUCCESS, FAILED, PARTIAL_FAILURE, CANCELLED
    idempotency_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    is_dry_run: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped["User"] = relationship("User", back_populates="workflows")
    steps: Mapped[List["WorkflowStep"]] = relationship("WorkflowStep", back_populates="workflow_run", order_by="WorkflowStep.step_number.asc()", cascade="all, delete-orphan")


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid_str)
    workflow_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    step_name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PENDING")  # PENDING, IN_PROGRESS, SUCCESS, FAILED, SKIPPED
    http_method: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    api_endpoint: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    http_status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payload_snapshot: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    workflow_run: Mapped["WorkflowRun"] = relationship("WorkflowRun", back_populates="steps")
