from datetime import datetime
from typing import List, Optional
from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, gen_uuid_str, utc_now


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid_str)
    github_user_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True, nullable=False)
    github_username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    connections: Mapped[List["GitHubConnection"]] = relationship("GitHubConnection", back_populates="user", cascade="all, delete-orphan")
    workflows: Mapped[List["WorkflowRun"]] = relationship("WorkflowRun", back_populates="user")
    managed_repositories: Mapped[List["ManagedRepository"]] = relationship("ManagedRepository", back_populates="user")
    audit_events: Mapped[List["AuditEvent"]] = relationship("AuditEvent", back_populates="user")
    settings: Mapped[List["AppSetting"]] = relationship("AppSetting", back_populates="user", cascade="all, delete-orphan")


class GitHubConnection(Base):
    __tablename__ = "github_connections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    encrypted_token_reference: Mapped[str] = mapped_column(Text, nullable=False)
    token_scope: Mapped[str] = mapped_column(Text, default="repo,read:user,user:email")
    connection_status: Mapped[str] = mapped_column(String(50), default="ACTIVE")  # ACTIVE, EXPIRED, REVOKED
    token_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user: Mapped["User"] = relationship("User", back_populates="connections")
