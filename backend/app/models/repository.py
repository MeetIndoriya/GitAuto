from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, gen_uuid_str, utc_now


class ManagedRepository(Base):
    __tablename__ = "managed_repositories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid_str, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    workflow_run_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("workflow_runs.id", ondelete="SET NULL"), nullable=True)
    github_repository_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True, nullable=False)
    github_node_id: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    repository_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    repository_full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    visibility: Mapped[str] = mapped_column(String(20), default="private")  # public, private
    default_branch: Mapped[str] = mapped_column(String(50), default="main")
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", index=True)  # ACTIVE, DELETED, PARTIAL_FAILURE, DELETED_EXTERNALLY
    remote_created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    remote_deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user: Mapped["User"] = relationship("User", back_populates="managed_repositories")
