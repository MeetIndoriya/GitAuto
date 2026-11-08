-- =============================================================================
-- GitAuto - Supabase PostgreSQL Database Schema Setup
-- 
-- Instructions:
-- 1. Open Supabase Dashboard -> Your Project -> SQL Editor
-- 2. Click "New Query", paste the entire contents of this file, and click "Run".
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    github_user_id BIGINT UNIQUE NOT NULL,
    github_username VARCHAR(100) UNIQUE NOT NULL,
    avatar_url TEXT,
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_github_user_id ON users (github_user_id);
CREATE INDEX IF NOT EXISTS idx_users_github_username ON users (github_username);

-- -----------------------------------------------------------------------------
-- 2. GitHub Connections Table (Tokens & Auth Scopes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS github_connections (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_token_reference TEXT NOT NULL,
    token_scope TEXT NOT NULL DEFAULT 'repo,read:user,user:email',
    connection_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_github_connections_user_id ON github_connections (user_id);

-- -----------------------------------------------------------------------------
-- 3. Workflow Runs Table (Automation Executions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_runs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    workflow_name VARCHAR(100) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    repository_name VARCHAR(150) NOT NULL,
    target_repository_id VARCHAR(36),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    is_dry_run BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_id ON workflow_runs (user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs (status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_started_at ON workflow_runs (started_at);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_repository_name ON workflow_runs (repository_name);

-- -----------------------------------------------------------------------------
-- 4. Workflow Steps Table (Step-by-Step Telemetry)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_steps (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    workflow_run_id VARCHAR(36) NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    http_method VARCHAR(10),
    api_endpoint TEXT,
    http_status_code INTEGER,
    duration_ms INTEGER,
    error_details TEXT,
    payload_snapshot JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_run_id ON workflow_steps (workflow_run_id);

-- -----------------------------------------------------------------------------
-- 5. Managed Repositories Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS managed_repositories (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    workflow_run_id VARCHAR(36) REFERENCES workflow_runs(id) ON DELETE SET NULL,
    github_repository_id BIGINT UNIQUE NOT NULL,
    github_node_id VARCHAR(150),
    repository_name VARCHAR(150) NOT NULL,
    repository_full_name VARCHAR(255) NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'private',
    default_branch VARCHAR(50) NOT NULL DEFAULT 'main',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    remote_created_at TIMESTAMPTZ,
    remote_deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_managed_repositories_user_id ON managed_repositories (user_id);
CREATE INDEX IF NOT EXISTS idx_managed_repositories_github_id ON managed_repositories (github_repository_id);
CREATE INDEX IF NOT EXISTS idx_managed_repositories_status ON managed_repositories (status);

-- -----------------------------------------------------------------------------
-- 6. Audit Events Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    workflow_run_id VARCHAR(36) REFERENCES workflow_runs(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    description TEXT NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events (created_at);

-- -----------------------------------------------------------------------------
-- 7. App Settings Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_settings_user_key ON app_settings (user_id, setting_key);

-- =============================================================================
-- Verification Query (Run this to confirm all tables exist):
-- =============================================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'github_connections', 'workflow_runs', 'workflow_steps', 'managed_repositories', 'audit_events', 'app_settings')
ORDER BY table_name;
