# System Architecture Document (ARCHITECTURE.md)

## Project: GitHub Repository Lifecycle Automation System (GitAuto)

**Document Version:** 1.0.0  
**Status:** Approved / Architecture Baseline  
**Lead Architect:** Principal Software Architect & Application Security Team  
**Date:** November 2026  
**Target Implementation:** Next.js (TypeScript, Tailwind CSS, shadcn/ui, Anime.js) + FastAPI (Python 3.12, Pydantic v2, HTTPX) + Supabase PostgreSQL

---

## 1. Executive Summary & Architecture Overview

The **GitHub Repository Lifecycle Automation System (`GitAuto`)** is an enterprise-grade, single-user, allowlisted web platform that automates repetitive GitHub repository provisioning, boilerplate scaffolding, and governed de-provisioning workflows.

### 1.1 Architectural Objectives
- **Security & Single-Tenant Isolation:** Restrict access exclusively to a pre-configured authorized GitHub identity via OAuth 2.0 with PKCE (`S256`), protected by encrypted HTTP-only session cookies and AES-256-GCM encrypted token storage.
- **Durable Lifecycle Orchestration:** Execute multi-step repository creation, atomic content publishing, and safe deletion through an asynchronous, stateful automation engine with step-level audit logging.
- **Fail-Safe Destructive Operations:** Enforce multi-layer safety interlocks preventing arbitrary repository deletion, verifying immutable GitHub repository IDs (`github_repo_id`), requiring typed confirmation, and validating remote deletion.
- **Immutable Historical Observability:** Maintain 100% persistent execution history and step-level metrics in PostgreSQL, retaining full auditability even after remote repositories are deleted.
- **Modern User Experience:** Provide a responsive, high-performance UI using Next.js App Router, shadcn/ui design primitives, and fluid, accessible Anime.js micro-interactions.

---

## 2. Technology Stack & Decision Rationale

```
+----------------------------------------------------------------------------------------------------+
|                                         GITAUTO TECH STACK                                         |
+----------------------------------------------------------------------------------------------------+
| Layer                 | Technology Choice         | Version / Specs     | Primary Rationale         |
+-----------------------+---------------------------+---------------------+---------------------------+
| Frontend Framework    | Next.js (App Router)      | >= 14.2 (React 18/19)| SSR, Server Components,   |
|                       |                           |                     | Fast routing, SEO/Vercel  |
| UI Design System      | Tailwind CSS + shadcn/ui  | Tailwind v3.4+, Radix| Accessible primitives,    |
|                       |                           |                     | headless UI, zero runtime |
| Micro-Interactions    | Anime.js                  | v3.2.2              | High-performance JS engine|
|                       |                           |                     | for timeline orchestrations|
| Backend API Engine    | FastAPI (Python)          | Python 3.12, v0.111+| Asynchronous I/O, OpenAPI,|
|                       |                           |                     | native Pydantic validation|
| Schema & Validation   | Pydantic v2               | v2.7+               | Ultra-fast Rust-core DTOs |
| HTTP & GitHub Client  | HTTPX (Async)             | v0.27+              | Native async HTTP/2 client|
| Database & Storage    | Supabase PostgreSQL       | Postgres 15+        | Relational integrity, RLS,|
|                       |                           |                     | JSONB audit storage       |
| ORM / Query Builder   | SQLAlchemy 2.0 (Async)    | v2.0+ (asyncpg)     | Type-safe async DB layer  |
| Database Migrations   | Alembic                   | v1.13+              | Versioned schema upgrades |
| Security & Cryptography| Cryptography (Fernet/AES) | PyCA cryptography   | AES-256-GCM token storage |
| Identity Provider     | GitHub App / OAuth 2.0    | PKCE S256 Flow      | Exclusive identity auth   |
+-----------------------+---------------------------+---------------------+---------------------------+
```

---

## 3. High-Level System Architecture & Component Interaction

### 3.1 System Context Diagram (Mermaid)

```mermaid
graph TB
    subgraph Client["Browser (Client Device)"]
        UI["Next.js Single Page App\n(shadcn/ui + Anime.js)"]
    end

    subgraph EdgeFrontend["Frontend Layer (Next.js App Router)"]
        RSC["Server Components (RSC)"]
        Proxy["API Route Proxy / Session Bridge"]
    end

    subgraph BackendAPI["Backend Service Layer (FastAPI on Python 3.12)"]
        AuthModule["Auth & PKCE Service"]
        Orchestrator["Automation Engine / Workflow Orchestrator"]
        RepoService["Repository Lifecycle Manager"]
        AuditService["History & Audit Logging Engine"]
        GHClient["Async GitHub API Client (HTTPX)"]
    end

    subgraph DataLayer["Persistence Layer (Supabase PostgreSQL)"]
        DB[(PostgreSQL 15+ Engine)]
        Tables["users\ngithub_connections\nworkflow_runs\nworkflow_steps\nmanaged_repositories\naudit_events\napp_settings"]
    end

    subgraph ExternalProvider["External Cloud Services"]
        GitHubAuth["GitHub OAuth 2.0 / App Auth\n(github.com/login/oauth)"]
        GitHubREST["GitHub REST API v3\n(api.github.com)"]
    end

    UI <-->|HTTP / HTTPS + SameSite Cookies| EdgeFrontend
    EdgeFrontend <-->|Internal REST API calls / JSON| BackendAPI
    BackendAPI <-->|asyncpg Connection Pool| DataLayer
    BackendAPI <-->|OAuth 2.0 PKCE Code Exchange| GitHubAuth
    BackendAPI <-->|REST v3 API (Bearer Token)| GitHubREST
```

### 3.2 Component Responsibilities

1. **Next.js Frontend (`frontend/`):**
   - Renders server-side authenticated layout shells and dynamic client dashboards.
   - Leverages **shadcn/ui** components (Radix primitives) for accessible dialogs, dropdowns, tables, and forms.
   - Employs **Anime.js** for step progress timelines, state change micro-animations, and entry transitions.
   - Manages client-side optimistic UI state and communicates with backend endpoints via typed API clients.

2. **FastAPI Backend (`backend/`):**
   - Exposes versioned REST API (`/api/v1/*`) with strict Pydantic v2 schemas and auto-generated OpenAPI docs.
   - Implements stateful OAuth 2.0 PKCE dance, allowlist verification, and encrypted JWT session cookies.
   - Manages asynchronous, state-machine driven automation runs with step persistence and transactional safety.
   - Performs rate-limit tracking, header sanitization, and structured audit event emitting.

3. **Supabase PostgreSQL (`database/`):**
   - Acts as the single source of truth for execution logs, step timelines, repository registry, and settings.
   - Enforces foreign key referential integrity, check constraints, and indexed historical lookups.
   - Configured with Row Level Security (RLS) policies for tenant data isolation.

---

## 4. GitHub Authentication Architecture (OAuth 2.0 + PKCE)

### 4.1 Authentication Protocol & Security Model
GitAuto utilizes **GitHub OAuth 2.0 with Proof Key for Code Exchange (PKCE)** using the `S256` method to eliminate authorization code interception vectors.

```mermaid
sequenceDiagram
    autonumber
    actor User as Authorized User
    participant Browser as Browser Client
    participant Frontend as Next.js (/login)
    participant Backend as FastAPI (/api/v1/auth)
    participant GitHub as GitHub OAuth Server
    participant DB as Supabase PostgreSQL

    User->>Browser: Navigate to /login
    Browser->>Frontend: Request Login Page
    Frontend-->>Browser: Render Login View (shadcn/ui + Anime.js)
    User->>Browser: Click "Continue with GitHub"
    Browser->>Backend: GET /api/v1/auth/github/login
    Note over Backend: Generate cryptographically random<br/>code_verifier (128 chars)<br/>code_challenge = BASE64URL(SHA256(verifier))<br/>state = secure_random_token()
    Backend-->>Browser: 302 Redirect to GitHub Auth URL<br/>Set-Cookie: gitauto_oauth_state (Encrypted, HTTP-Only)
    Browser->>GitHub: GET /login/oauth/authorize?client_id=...&code_challenge=...&code_challenge_method=S256&state=...&scope=repo,read:user,user:email
    User->>GitHub: Consent / Authorize Permissions
    GitHub-->>Browser: 302 Redirect to /api/v1/auth/github/callback?code=AUTH_CODE&state=STATE
    Browser->>Backend: GET /api/v1/auth/github/callback?code=AUTH_CODE&state=STATE
    Note over Backend: 1. Validate State against Cookie<br/>2. Exchange code + code_verifier for Access Token
    Backend->>GitHub: POST /login/oauth/access_token (code, client_id, code_verifier)
    GitHub-->>Backend: 200 OK { access_token, token_type, scope }
    Backend->>GitHub: GET /user (Authorization: Bearer access_token)
    GitHub-->>Backend: 200 OK { id: 12345, login: "octocat", avatar_url: "..." }
    Note over Backend: 3. Verify Allowlist:<br/>login.lower() == GITHUB_AUTHORIZED_USER.lower()
    alt User is NOT Authorized
        Backend-->>Browser: 302 Redirect to /login?error=unauthorized_account
    else User is Authorized
        Note over Backend: 4. Encrypt Access Token (AES-256-GCM)<br/>5. Upsert User & GitHub Connection in DB<br/>6. Issue Session JWT
        Backend->>DB: Upsert User & Encrypted Connection
        Backend-->>Browser: 302 Redirect to /dashboard<br/>Set-Cookie: gitauto_session (Signed, HTTP-Only, Secure, SameSite=Lax)
    end
```

### 4.2 GitHub Permissions & Scopes Breakdown

| Scope | Permission Justification | Minimum Privilege Analysis |
| :--- | :--- | :--- |
| `repo` | Mandatory for full control of private and public repositories, including repository creation, commit creation, and repository deletion. | GitHub does not provide granular sub-scopes for personal OAuth Apps; `repo` is the minimum required scope to create, write initial files, and delete personal repositories. |
| `read:user` | Mandatory to retrieve user profile data (GitHub ID, username, avatar) for dashboard display and allowlist validation. | Read-only profile scope without write capabilities. |
| `user:email`| Required as a fallback to confirm account ownership and identify the authenticated user's primary verified email address. | Read-only email address access. |

### 4.3 Session Security & Lifecycle Management
- **Session Tokens:** Stateless, signed HMAC-SHA256 JWT containing `sub` (User UUID), `github_username`, `exp` (14 days), and `jti` (unique session ID).
- **Cookie Flags:** `HttpOnly = true`, `Secure = true` (enforced in production), `SameSite = Lax`, `Path = /`, `Max-Age = 1209600` (14 days).
- **Token at Rest:** GitHub access tokens stored in `github_connections.encrypted_token_reference` are encrypted using `AES-256-GCM` with an initialization vector (IV) and authentication tag derived from `MASTER_ENCRYPTION_KEY`.
- **Re-Authentication / Token Expiry:** If a GitHub API call fails with `401 Unauthorized` (e.g. token revoked by user), the backend marks `github_connections.connection_status = 'EXPIRED'`, invalidates the session cookie, and prompts a clean re-authentication modal.

---

## 5. GitHub API Integration Specification

### 5.1 Standard REST API Endpoints Used

```
+----------------------------------------------------------------------------------------------------------------+
|                                        GITHUB REST API V3 INTEGRATIONS                                         |
+----------------------------------------------------------------------------------------------------------------+
| Operation             | Method | GitHub API Endpoint                  | Required Scope | Expected Response Code |
+-----------------------+--------+--------------------------------------+----------------+------------------------+
| Get User Profile      | GET    | `/user`                              | `read:user`    | 200 OK                 |
| Create Repository     | POST   | `/user/repos`                        | `repo`         | 201 Created            |
| Push README.md        | PUT    | `/repos/{owner}/{repo}/contents/{path}`| `repo`       | 201 Created            |
| Push .gitignore       | PUT    | `/repos/{owner}/{repo}/contents/{path}`| `repo`       | 201 Created            |
| Verify Branch HEAD    | GET    | `/repos/{owner}/{repo}/branches/{br}`| `repo`         | 200 OK                 |
| Verify Repository ID  | GET    | `/repos/{owner}/{repo}`              | `repo`         | 200 OK                 |
| Delete Repository     | DELETE | `/repos/{owner}/{repo}`              | `repo` (admin) | 204 No Content         |
| Check Rate Limit Status| GET   | `/rate_limit`                        | `read:user`    | 200 OK                 |
+-----------------------+--------+--------------------------------------+----------------+------------------------+
```

### 5.2 API Interaction Payloads & Protocols

#### 1. Repository Creation (`POST https://api.github.com/user/repos`)
```json
// Request Payload
{
  "name": "sandbox-demo-service",
  "description": "Standardized microservice sandbox provisioned by GitAuto",
  "private": true,
  "has_issues": true,
  "has_projects": false,
  "has_wiki": false,
  "auto_init": false
}
```
*Note: `auto_init: false` is used to allow GitAuto to construct and commit customized `README.md` and `.gitignore` programmatically via explicit commit steps.*

#### 2. Content Publishing (`PUT https://api.github.com/repos/{owner}/{repo}/contents/{path}`)
```json
// Request Payload for README.md
{
  "message": "chore: initialize repository via GitAuto automation",
  "content": "IyBzYW5kYm94LWRlbW8tc2VydmljZQoKUHJvdmlzaW9uZWQgYnkgR2l0QXV0by4=", // Base64 encoded UTF-8
  "branch": "main"
}
```

#### 3. Repository Deletion (`DELETE https://api.github.com/repos/{owner}/{repo}`)
- **Pre-execution Verification:** Fetch `GET /repos/{owner}/{repo}` to assert that remote `id` exactly matches `managed_repositories.github_repository_id`.
- **Deletion Request:** Header `X-GitHub-Api-Version: 2022-11-28`.
- **Post-execution Verification:** Poll `GET /repos/{owner}/{repo}` with exponential backoff (up to 3 retries) until GitHub returns `404 Not Found`.

### 5.3 Rate-Limit Handling & Header Sanitization
- Every HTTP response is intercepted by `GitHubClientInterceptor`.
- Reads `x-ratelimit-remaining`, `x-ratelimit-limit`, and `x-ratelimit-reset`.
- If `x-ratelimit-remaining <= 5`, emits a rate-limit alert event and returns `429 Too Many Requests` with the computed reset cooldown in seconds.
- All request and response loggers scrub `Authorization`, `Cookie`, and `token` fields.

---

## 6. Backend Architecture (FastAPI Modular Design)

### 6.1 Backend Module Hierarchy

```
backend/
├── app/
│   ├── main.py                  # FastAPI application factory, lifespan, CORS, middleware
│   ├── config.py                # Pydantic BaseSettings (Environment variables validation)
│   ├── api/                     # Versioned API Routers
│   │   ├── deps.py              # Dependency injection (DB session, current user, GitHub client)
│   │   └── v1/
│   │       ├── router.py        # Master API v1 router
│   │       ├── auth.py          # /auth (login, callback, me, logout, PKCE state)
│   │       ├── dashboard.py     # /dashboard (aggregated metrics & recent runs)
│   │       ├── automations.py   # /automations (trigger, cancel, dry-run, step status)
│   │       ├── repositories.py  # /repositories (managed repository registry & deletion)
│   │       ├── history.py       # /history (paginated query, filtering, step timeline)
│   │       ├── settings.py      # /settings (user preferences & GitHub connection status)
│   │       └── health.py        # /health, /ready (liveness & readiness probes)
│   ├── core/                    # Core system components
│   │   ├── security.py          # JWT creation/verification, AES-256-GCM cipher utilities
│   │   ├── exceptions.py        # Custom domain exceptions & global exception handlers
│   │   └── logging.py           # Structured JSON logger with sensitive data sanitization
│   ├── models/                  # SQLAlchemy 2.0 Async ORM Models
│   │   ├── user.py              # User & GitHubConnection entities
│   │   ├── workflow.py          # WorkflowRun & WorkflowStep entities
│   │   ├── repository.py        # ManagedRepository entity
│   │   └── audit.py             # AuditEvent & AppSettings entities
│   ├── schemas/                 # Pydantic v2 DTOs (Request / Response validation)
│   │   ├── auth.py
│   │   ├── dashboard.py
│   │   ├── workflow.py
│   │   ├── repository.py
│   │   ├── history.py
│   │   └── settings.py
│   ├── services/                # Business Logic Layer
│   │   ├── auth_service.py      # OAuth exchange, allowlist checking, session issuance
│   │   ├── workflow_engine.py   # State machine, step executor, idempotency coordinator
│   │   ├── github_service.py    # High-level GitHub business workflows
│   │   ├── repo_service.py      # Managed repository registry & safety verification
│   │   └── audit_service.py     # Structured audit logging & metric calculations
│   ├── repositories/            # Data Access Layer (CRUD abstractions)
│   │   ├── base.py              # Generic async repository pattern
│   │   ├── user_repo.py
│   │   ├── workflow_repo.py
│   │   └── repository_repo.py
│   └── integrations/            # External Clients
│       └── github_client.py     # Async HTTPX client for GitHub REST API v3
```

---

## 7. Automation Engine & State Machine

### 7.1 Workflow Execution Architecture
The automation engine runs durable, transactional workflows directly inside FastAPI utilizing `asyncio` background tasks and database-backed state checkpoints.

```mermaid
stateDiagram-v2
    [*] --> PENDING: Workflow Initiated
    PENDING --> IN_PROGRESS: Step 1: Validate Auth & Config
    IN_PROGRESS --> IN_PROGRESS: Step 2: Create Remote Repository
    IN_PROGRESS --> IN_PROGRESS: Step 3: Record Managed Repository ID
    IN_PROGRESS --> IN_PROGRESS: Step 4: Prepare File Templates
    IN_PROGRESS --> IN_PROGRESS: Step 5: Push Initial Content Commit
    IN_PROGRESS --> IN_PROGRESS: Step 6: Verify Commit SHA on HEAD
    
    IN_PROGRESS --> SUCCESS: All Steps Completed
    IN_PROGRESS --> PARTIAL_FAILURE: Repo Created, Content Push Failed
    IN_PROGRESS --> FAILED: Critical Step Failure (Before Creation)
    
    PARTIAL_FAILURE --> IN_PROGRESS: User Retries Scaffolding Step
    
    SUCCESS --> [*]
    FAILED --> [*]
    PARTIAL_FAILURE --> [*]
```

### 7.2 Safety Invariants & Execution Rules
1. **No Automatic Cascade Deletion:** If Step 2 (Create Repo) succeeds but Step 5 (Push Content) fails, the workflow enters `PARTIAL_FAILURE`. The repository is **never** automatically deleted.
2. **Idempotency Key:** Each execution receives a UUIDv4 `idempotency_key`. Retrying a workflow verifies if the repository already exists on GitHub before executing creation.
3. **Step Timeout & Retries:** Individual GitHub API calls have a 10.0-second timeout with a maximum of 2 safe retries (exponential backoff) for idempotent read operations. Write mutations are executed with strict idempotency verification.
4. **Dry-Run Mode:** Evaluates all input validations, generates file templates, computes commit hashes, and returns a simulated execution trace without executing any network mutations on GitHub.

---

## 8. Database Architecture (Supabase PostgreSQL)

### 8.1 Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    users ||--o{ github_connections : "has"
    users ||--o{ workflow_runs : "executes"
    users ||--o{ managed_repositories : "owns"
    users ||--o{ audit_events : "generates"
    users ||--o{ app_settings : "configures"

    workflow_runs ||--|{ workflow_steps : "contains"
    workflow_runs ||--o{ managed_repositories : "provisions"
    workflow_runs ||--o{ audit_events : "emits"

    users {
        uuid id PK
        bigint github_user_id UK
        varchar github_username UK
        text avatar_url
        varchar email
        timestamptz created_at
        timestamptz updated_at
    }

    github_connections {
        uuid id PK
        uuid user_id FK
        text encrypted_token_reference
        text token_scope
        varchar connection_status
        timestamptz token_expiry
        timestamptz created_at
        timestamptz updated_at
    }

    workflow_runs {
        uuid id PK
        uuid user_id FK
        varchar workflow_name
        varchar operation_type
        varchar repository_name
        uuid target_repository_id FK
        varchar status
        varchar idempotency_key UK
        boolean is_dry_run
        timestamptz started_at
        timestamptz completed_at
        integer duration_ms
        text error_message
        jsonb metadata
        timestamptz created_at
    }

    workflow_steps {
        uuid id PK
        uuid workflow_run_id FK
        integer step_number
        varchar step_name
        varchar status
        varchar http_method
        text api_endpoint
        integer http_status_code
        integer duration_ms
        text error_details
        jsonb payload_snapshot
        timestamptz started_at
        timestamptz completed_at
    }

    managed_repositories {
        uuid id PK
        uuid user_id FK
        uuid workflow_run_id FK
        bigint github_repository_id UK
        varchar github_node_id UK
        varchar repository_name
        varchar repository_full_name
        varchar visibility
        varchar default_branch
        varchar status
        timestamptz remote_created_at
        timestamptz remote_deleted_at
        timestamptz created_at
        timestamptz updated_at
    }

    audit_events {
        uuid id PK
        uuid user_id FK
        uuid workflow_run_id FK
        varchar event_type
        varchar severity
        text description
        inet ip_address
        text user_agent
        jsonb metadata
        timestamptz created_at
    }

    app_settings {
        uuid id PK
        uuid user_id FK
        varchar setting_key
        jsonb setting_value
        timestamptz updated_at
    }
```

### 8.2 Database DDL & Schema Definitions

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_user_id BIGINT UNIQUE NOT NULL,
    github_username VARCHAR(100) UNIQUE NOT NULL,
    avatar_url TEXT,
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. GITHUB CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS github_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_token_reference TEXT NOT NULL,
    token_scope TEXT NOT NULL DEFAULT 'repo,read:user,user:email',
    connection_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, REVOKED
    token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_conn_status CHECK (connection_status IN ('ACTIVE', 'EXPIRED', 'REVOKED'))
);

-- 3. WORKFLOW RUNS (HISTORY) TABLE
CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    workflow_name VARCHAR(100) NOT NULL,
    operation_type VARCHAR(50) NOT NULL, -- CREATE_REPOSITORY, DELETE_REPOSITORY, RETRY_SCAFFOLD
    repository_name VARCHAR(150) NOT NULL,
    target_repository_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, SUCCESS, FAILED, PARTIAL_FAILURE, CANCELLED
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    is_dry_run BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_wf_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'PARTIAL_FAILURE', 'CANCELLED')),
    CONSTRAINT chk_wf_op_type CHECK (operation_type IN ('CREATE_REPOSITORY', 'DELETE_REPOSITORY', 'RETRY_SCAFFOLD'))
);

-- 4. WORKFLOW STEPS TABLE
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, SUCCESS, FAILED, SKIPPED
    http_method VARCHAR(10),
    api_endpoint TEXT,
    http_status_code INTEGER,
    duration_ms INTEGER,
    error_details TEXT,
    payload_snapshot JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT chk_step_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'SKIPPED'))
);

-- 5. MANAGED REPOSITORIES REGISTRY
CREATE TABLE IF NOT EXISTS managed_repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    workflow_run_id UUID REFERENCES workflow_runs(id) ON DELETE SET NULL,
    github_repository_id BIGINT UNIQUE NOT NULL,
    github_node_id VARCHAR(150) UNIQUE NOT NULL,
    repository_name VARCHAR(150) NOT NULL,
    repository_full_name VARCHAR(255) NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'private', -- public, private
    default_branch VARCHAR(50) NOT NULL DEFAULT 'main',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DELETED, PARTIAL_FAILURE, DELETED_EXTERNALLY
    remote_created_at TIMESTAMPTZ NOT NULL,
    remote_deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_repo_status CHECK (status IN ('ACTIVE', 'DELETED', 'PARTIAL_FAILURE', 'DELETED_EXTERNALLY')),
    CONSTRAINT chk_visibility CHECK (visibility IN ('public', 'private'))
);

-- 6. AUDIT EVENTS TABLE
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    workflow_run_id UUID REFERENCES workflow_runs(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- AUTH_LOGIN, AUTH_LOGOUT, REPO_CREATED, REPO_DELETED, SAFETY_INTERLOCK_TRIGGERED
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO', -- INFO, WARN, ERROR, CRITICAL
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_severity CHECK (severity IN ('INFO', 'WARN', 'ERROR', 'CRITICAL'))
);

-- 7. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_setting UNIQUE (user_id, setting_key)
);

-- INDEXES FOR HIGH-PERFORMANCE QUERIES
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_status ON workflow_runs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_started_at ON workflow_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_repo_name ON workflow_runs(repository_name);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_run_id ON workflow_steps(workflow_run_id, step_number ASC);
CREATE INDEX IF NOT EXISTS idx_managed_repos_user_status ON managed_repositories(user_id, status);
CREATE INDEX IF NOT EXISTS idx_managed_repos_gh_id ON managed_repositories(github_repository_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_created ON audit_events(user_id, created_at DESC);
```

### 8.3 Row-Level Security (RLS) Policies
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Backend Service Role has full access; User level policy isolates rows by authenticated user_id
CREATE POLICY user_isolation_workflow_runs ON workflow_runs
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY user_isolation_managed_repositories ON managed_repositories
    FOR ALL USING (user_id = auth.uid());
```

---

## 9. REST API Contract Specification

Base URL: `/api/v1`  
Standard Error Format:
```json
{
  "success": false,
  "error": {
    "code": "REPOSITORY_NAME_EXISTS",
    "message": "A repository with the name 'sandbox-demo' already exists on your GitHub account.",
    "details": { "field": "repository_name", "value": "sandbox-demo" }
  },
  "timestamp": "2026-11-06T07:47:00Z"
}
```

### 9.1 Authentication Endpoints (`/api/v1/auth`)

#### `GET /api/v1/auth/github/login`
- **Purpose:** Initiates GitHub OAuth 2.0 PKCE dance.
- **Auth:** Public.
- **Response:** `302 Redirect` to `https://github.com/login/oauth/authorize?...` + Set-Cookie `gitauto_pkce_state`.

#### `GET /api/v1/auth/github/callback`
- **Purpose:** Receives GitHub OAuth code, verifies PKCE challenge, checks username against allowlist, issues session cookie.
- **Auth:** Public (OAuth callback).
- **Query Params:** `code: string`, `state: string`.
- **Response:** `302 Redirect` to `/dashboard` (or `/login?error=...`) + Set-Cookie `gitauto_session`.

#### `GET /api/v1/auth/me`
- **Purpose:** Returns authenticated user profile and connection health.
- **Auth:** Session Cookie required.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "e4b6c374-...",
    "github_user_id": 1234567,
    "github_username": "octocat",
    "avatar_url": "https://avatars.githubusercontent.com/u/1234567",
    "email": "octocat@github.com",
    "connection": {
      "status": "ACTIVE",
      "scopes": ["repo", "read:user", "user:email"],
      "rate_limit_remaining": 4980,
      "rate_limit_total": 5000,
      "rate_limit_reset_at": "2026-11-06T08:30:00Z"
    }
  }
}
```

#### `POST /api/v1/auth/logout`
- **Purpose:** Clears session cookie and logs user out.
- **Response (200 OK):** `{ "success": true, "message": "Successfully logged out." }`

---

### 9.2 Dashboard Endpoints (`/api/v1/dashboard`)

#### `GET /api/v1/dashboard/summary`
- **Purpose:** Returns aggregated dashboard statistics and recent 5 runs.
- **Auth:** Session Cookie required.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "total_executions": 48,
      "successful_executions": 46,
      "failed_executions": 2,
      "success_rate_percentage": 95.8,
      "active_managed_repositories": 12,
      "deleted_repositories": 34
    },
    "recent_activity": [
      {
        "id": "7b8e12a4-...",
        "workflow_name": "Create Repository & Push Content",
        "operation_type": "CREATE_REPOSITORY",
        "repository_name": "sandbox-demo-1",
        "status": "SUCCESS",
        "started_at": "2026-11-06T07:12:00Z",
        "duration_ms": 2840
      }
    ]
  }
}
```

---

### 9.3 Automation Endpoints (`/api/v1/automations`)

#### `POST /api/v1/automations`
- **Purpose:** Triggers a new repository creation and initial content push workflow.
- **Auth:** Session Cookie required.
- **Request Body:**
```json
{
  "repository_name": "sandbox-demo-app",
  "description": "Prototype application created via GitAuto",
  "visibility": "private",
  "default_branch": "main",
  "init_readme": true,
  "readme_template": "# sandbox-demo-app\n\nAutomated project scaffold.",
  "gitignore_template": "Node",
  "is_dry_run": false
}
```
- **Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "execution_id": "9f1c7d2e-...",
    "status": "PENDING",
    "repository_name": "sandbox-demo-app",
    "is_dry_run": false,
    "started_at": "2026-11-06T07:47:00Z"
  }
}
```

#### `GET /api/v1/automations/{execution_id}`
- **Purpose:** Returns live execution status and step timeline.
- **Auth:** Session Cookie required.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "9f1c7d2e-...",
    "workflow_name": "Create Repository & Push Content",
    "operation_type": "CREATE_REPOSITORY",
    "repository_name": "sandbox-demo-app",
    "status": "IN_PROGRESS",
    "current_step": 3,
    "total_steps": 6,
    "started_at": "2026-11-06T07:47:00Z",
    "steps": [
      {
        "step_number": 1,
        "step_name": "Validate Account & Scopes",
        "status": "SUCCESS",
        "duration_ms": 120,
        "http_status_code": 200
      },
      {
        "step_number": 2,
        "step_name": "Create Remote Repository",
        "status": "SUCCESS",
        "duration_ms": 840,
        "http_status_code": 201
      },
      {
        "step_number": 3,
        "step_name": "Record Repository Registry",
        "status": "IN_PROGRESS",
        "duration_ms": null,
        "http_status_code": null
      }
    ]
  }
}
```

---

### 9.4 Repository & Destructive Deletion Endpoints (`/api/v1/repositories`)

#### `GET /api/v1/repositories`
- **Purpose:** Lists all repositories created and tracked by GitAuto.
- **Query Params:** `status=ACTIVE|DELETED|PARTIAL_FAILURE`, `page=1`, `limit=20`.

#### `DELETE /api/v1/repositories/{id}`
- **Purpose:** Deletes a tracked repository with double confirmation and ID verification.
- **Auth:** Session Cookie required.
- **Request Body:**
```json
{
  "confirm_repository_name": "sandbox-demo-app",
  "expected_github_repo_id": 89472190
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "repository_id": "e4b6c374-...",
    "repository_name": "sandbox-demo-app",
    "status": "DELETED",
    "deletion_execution_id": "3a9f0e1c-...",
    "deleted_at": "2026-11-06T07:49:00Z"
  }
}
```

---

### 9.5 History Endpoints (`/api/v1/history`)

#### `GET /api/v1/history`
- **Purpose:** Search and multi-filtered paginated execution history.
- **Query Params:** `q=search_term`, `status=SUCCESS|FAILED|...`, `operation_type=...`, `from_date=...`, `to_date=...`, `page=1`, `limit=25`, `sort=desc`.
- **Response (200 OK):** Paginated collection with `items: WorkflowRunSummary[]`, `total_count: int`, `page: int`, `total_pages: int`.

#### `GET /api/v1/history/{execution_id}`
- **Purpose:** Detailed step-by-step audit record including API payloads and HTTP status codes.

---

## 10. Security Architecture & Threat Mitigation

### 10.1 Comprehensive Threat Matrix

| Threat / Attack Vector | Impact Level | Architectural Mitigation Strategy |
| :--- | :--- | :--- |
| **OAuth Code Interception** | Critical | Enforce PKCE `S256` method with ephemeral server-side verifiers. |
| **Unauthorized Account Login** | Critical | Reject login callbacks immediately if GitHub login doesn't match `GITHUB_AUTHORIZED_USER`. |
| **Session Hijacking / XSS** | High | Store session JWT in `HttpOnly`, `Secure`, `SameSite=Lax` cookie. No localStorage token persistence. |
| **Arbitrary Repository Deletion** | Critical | Verify `managed_repositories` record exists, verify remote `github_repo_id`, require matching confirmation string. |
| **Secret Leakage in Logs** | High | Log sanitization filter automatically redacts authorization headers, access tokens, and cookies from output streams. |
| **Database Token Compromise** | Critical | Encrypt all GitHub access tokens at rest using AES-256-GCM authenticated encryption. |
| **CSRF Attacks** | High | Utilize encrypted, single-use `state` parameters bound to short-lived cookies for OAuth, plus `SameSite=Lax`. |
| **GitHub Rate Limiting** | Medium | Proactive rate-limit budget tracking, exponential backoff, and UI warning banners upon reaching threshold. |

---

## 11. Frontend Architecture (Next.js + shadcn/ui + Anime.js)

### 11.1 Component Hierarchy & Route Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with Toast provider & Theme provider
│   │   ├── page.tsx               # Index redirect to /dashboard or /login
│   │   ├── login/
│   │   │   └── page.tsx           # GitHub Login page with animated entrance
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Protected layout with Sidebar & Header
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Metrics summary cards & recent activity table
│   │   │   ├── automations/
│   │   │   │   ├── page.tsx       # Automation catalog
│   │   │   │   └── new/
│   │   │   │       └── page.tsx   # New automation launcher form (Task 1 & Task 2)
│   │   │   ├── history/
│   │   │   │   ├── page.tsx       # Searchable & filterable history table
│   │   │   │   └── [executionId]/
│   │   │   │       └── page.tsx   # Step-by-step timeline view
│   │   │   ├── repositories/
│   │   │   │   └── page.tsx       # Tracked repository registry & deletion modal
│   │   │   └── settings/
│   │   │       ├── page.tsx       # App preferences & defaults
│   │   │       └── github/
│   │   │           └── page.tsx   # GitHub connection status & rate-limit details
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components (Radix primitives)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── switch.tsx
│   │   │   └── skeleton.tsx
│   │   ├── common/                # Shared layout elements
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── status-badge.tsx
│   │   │   └── error-boundary.tsx
│   │   └── automations/           # Domain-specific components
│   │       ├── creation-form.tsx
│   │       ├── deletion-modal.tsx
│   │       ├── execution-timeline.tsx
│   │       └── dry-run-preview.tsx
│   ├── hooks/                     # Custom React Hooks
│   │   ├── use-auth.ts
│   │   ├── use-automations.ts
│   │   ├── use-history.ts
│   │   └── use-anime.ts           # Anime.js hook with cleanup & reduced-motion checks
│   ├── lib/
│   │   ├── api-client.ts          # Typed HTTP fetch wrapper with error handling
│   │   ├── animations.ts          # Reusable Anime.js timeline definitions
│   │   └── utils.ts               # Tailwind cn helper & formatters
│   └── types/                     # Shared TypeScript DTO interfaces
│       ├── api.ts
│       ├── auth.ts
│       ├── workflow.ts
│       └── repository.ts
```

### 11.2 shadcn/ui Component Usage Matrix

| Feature Module | shadcn/ui Components Used | User Experience Purpose |
| :--- | :--- | :--- |
| **Authentication** | `Card`, `Button`, `Badge` | Centered login card with GitHub logo and instance status badge. |
| **Dashboard** | `Card`, `Table`, `Badge`, `Skeleton` | Metric count cards, loading states, and recent activity rows. |
| **Automation Form** | `Input`, `Label`, `Switch`, `Tabs`, `Button` | Form controls for repository names, toggles for `.gitignore`, and Dry-Run preview. |
| **Deletion Interlock**| `Dialog`, `Input`, `Button (destructive)` | Non-dismissible modal requiring exact string match for repository deletion. |
| **Execution History** | `Table`, `Input`, `DropdownMenu`, `Badge` | Paginated data table with status filters and search bar. |
| **Timeline View** | `Card`, `Badge`, `Separator` | Chronological step-by-step progress cards. |

---

## 12. Animation Architecture (Anime.js)

### 12.1 Anime.js Integration Guidelines
GitAuto uses **Anime.js v3.2.2** for meaningful, performance-oriented UI micro-interactions. Animations are encapsulated in modular helpers and respect user accessibility preferences (`prefers-reduced-motion`).

```typescript
// frontend/src/lib/animations.ts
import anime from 'animejs';

/**
 * Checks if the user prefers reduced motion
 */
export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Staggered card entrance for dashboard and history lists
 */
export const animateCardEntrance = (targets: string | HTMLElement | HTMLElement[]) => {
  if (shouldReduceMotion()) return;
  
  anime({
    targets,
    translateY: [24, 0],
    opacity: [0, 1],
    easing: 'easeOutQuart',
    duration: 600,
    delay: anime.stagger(80)
  });
};

/**
 * Step completion pulse animation for workflow timeline
 */
export const animateStepComplete = (target: HTMLElement) => {
  if (shouldReduceMotion()) return;

  anime({
    targets: target,
    scale: [1, 1.08, 1],
    duration: 450,
    easing: 'easeInOutSine'
  });
};

/**
 * Destructive modal entrance shake/impact
 */
export const animateDestructiveWarning = (target: HTMLElement) => {
  if (shouldReduceMotion()) return;

  anime({
    targets: target,
    translateX: [-6, 6, -4, 4, -2, 2, 0],
    duration: 500,
    easing: 'easeInOutQuad'
  });
};
```

---

## 13. Complete Project Folder Structure

```
GitAuto/
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml           # Next.js build, lint & Vitest suite
│       └── backend-ci.yml            # FastAPI pytest suite & respx mocks
├── backend/
│   ├── app/
│   │   ├── api/                      # REST API Endpoints (v1)
│   │   ├── core/                     # Security, Config, Exceptions, Logging
│   │   ├── models/                   # SQLAlchemy DB Models
│   │   ├── schemas/                  # Pydantic v2 DTOs
│   │   ├── services/                 # Business Logic & Workflow Engine
│   │   ├── repositories/             # Database CRUD Layer
│   │   ├── integrations/             # HTTPX GitHub Client
│   │   ├── main.py                   # FastAPI Application Entrypoint
│   │   └── config.py                 # Environment Settings
│   ├── migrations/                   # Alembic Database Migrations
│   │   ├── env.py
│   │   └── versions/
│   ├── tests/                        # Pytest Test Suite
│   │   ├── conftest.py               # Test DB fixtures & mock clients
│   │   ├── test_auth.py              # OAuth PKCE & Allowlist tests
│   │   ├── test_workflow_engine.py   # State machine & partial failure tests
│   │   ├── test_github_client.py     # Respx mock GitHub API tests
│   │   └── test_repositories.py      # Deletion safety interlock tests
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                      # Next.js App Router Pages
│   │   ├── components/               # shadcn/ui & Custom Components
│   │   ├── hooks/                    # Custom React Hooks
│   │   ├── lib/                      # API client, Anime.js utilities
│   │   └── types/                    # TypeScript Type Definitions
│   ├── public/                       # Static Assets & Icons
│   ├── tests/                        # Vitest & Component Tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.mjs
├── database/
│   ├── schema.sql                    # Initial Supabase PostgreSQL Schema
│   └── seed.sql                      # Seed default app settings
├── docker-compose.yml                # Local full-stack development orchestration
├── PRD.md                            # Product Requirements Document
├── ARCHITECTURE.md                   # System Architecture Document (This file)
└── README.md                         # Project Overview & Quickstart Guide
```

---

## 14. Deployment & DevOps Architecture

### 14.1 Production Hosting Topology
- **Frontend:** Hosted on **Vercel** with global edge distribution, automatic preview deployments, and HTTPS termination.
- **Backend Service:** Hosted on a dedicated container platform (**Render**, **Fly.io**, or **Railway**) running Docker with Python 3.12 and Uvicorn workers.
- **Database:** **Supabase Managed PostgreSQL 15+** with daily automated backups, point-in-time recovery (PITR), and SSL connections enforced.

```mermaid
graph LR
    User([User Browser]) -->|HTTPS (TLS 1.3)| Vercel[Vercel Edge Network\nNext.js Frontend]
    Vercel -->|Internal HTTPS Proxy| Backend[Fly.io / Render Container\nFastAPI Application]
    Backend -->|Postgres SSL / Port 5432| Supabase[(Supabase PostgreSQL 15+)]
    Backend -->|HTTPS (TLS 1.3)| GitHubAPI[api.github.com / GitHub OAuth]
```

### 14.2 Environment Configuration Variables

```ini
# Backend Environment (.env)
ENVIRONMENT=production
PROJECT_NAME="GitAuto"
FASTAPI_PORT=8000
FRONTEND_ORIGIN="https://gitauto.yourdomain.com"

# GitHub App / OAuth Credentials
GITHUB_CLIENT_ID="Iv1.xxxxxxxxxxxx"
GITHUB_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GITHUB_AUTHORIZED_USER="your-github-username"
GITHUB_REDIRECT_URI="https://api.gitauto.yourdomain.com/api/v1/auth/github/callback"

# Security & Encryption
MASTER_ENCRYPTION_KEY="base64-32byte-aes-gcm-key"
JWT_SECRET_KEY="super-secret-jwt-signing-key"
JWT_ALGORITHM="HS256"
SESSION_COOKIE_NAME="gitauto_session"

# Supabase PostgreSQL Connection
DATABASE_URL="postgresql+asyncpg://postgres:[password]@db.[ref].supabase.co:5432/postgres"
SUPABASE_URL="https://[ref].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..." # Backend server-side ONLY
```

---

## 15. Testing Strategy & Quality Assurance

```
+----------------------------------------------------------------------------------------------------+
|                                    TESTING STRATEGY & PYRAMID                                      |
+----------------------------------------------------------------------------------------------------+
| Test Layer             | Framework / Tools       | Coverage Target | Focus Areas                   |
+-----------------------+---------------------------+-----------------+-------------------------------+
| Backend Unit Tests    | Pytest, Pydantic, unittest| > 90%           | Schemas, encryption, PKCE,    |
|                       |                           |                 | state machine transitions     |
| GitHub API Mock Tests | Respx, HTTPX              | 100% endpoints  | Rate limits, 404 verification,|
|                       |                           |                 | 422 unprocessable entities    |
| Backend Integration   | Pytest-Asyncio, TestClient| > 85%           | Endpoints, DB transactions,   |
|                       |                           |                 | deletion safety interlocks    |
| Frontend Components   | Vitest, React Testing Lib | > 80%           | shadcn/ui forms, Anime.js hook|
|                       |                           |                 | state rendering, dialogs      |
| End-to-End (E2E)      | Playwright                | Core user paths | Login flow, workflow trigger, |
|                       |                           |                 | deletion modal confirmation   |
+-----------------------+---------------------------+-----------------+-------------------------------+
```

### 15.1 Destructive Testing Safety Rules
- Automated tests **never** execute destructive API calls against a live production GitHub account.
- Integration tests use `respx` HTTP mocking to simulate GitHub API 201 Created, 204 No Content, and 404 Not Found responses.
- Sandbox E2E tests target a designated disposable GitHub test account with strict repository prefix checks (`gitauto-test-*`).

---

## 16. Error-Handling Strategy & Fault Tolerance

```
+----------------------------------------------------------------------------------------------------+
|                                      FAULT RECOVERY PROTOCOLS                                      |
+----------------------------------------------------------------------------------------------------+
| Failure Mode          | System Detection          | Automated Action     | User Experience          |
+-----------------------+---------------------------+----------------------+--------------------------+
| GitHub Token Expired  | HTTP 401 from GitHub API  | Invalidate session,  | Re-authentication modal  |
| / Revoked             |                           | mark DB status       | with session recovery    |
+-----------------------+---------------------------+----------------------+--------------------------+
| Name Conflict         | HTTP 422 from GitHub API  | Abort workflow prior | Clear inline form error: |
|                       |                           | to state creation    | "Repo name already taken"|
+-----------------------+---------------------------+----------------------+--------------------------+
| Content Commit Failed | HTTP 5xx / Timeout on PUT | Mark status as       | Repository is preserved; |
| after Repo Created    |                           | `PARTIAL_FAILURE`    | "Retry Push" button shown|
+-----------------------+---------------------------+----------------------+--------------------------+
| Rate Limit Reached    | HTTP 403 / 429 status     | Pause executions,    | Banner with countdown to |
|                       |                           | extract reset header | exact reset timestamp    |
+-----------------------+---------------------------+----------------------+--------------------------+
| Browser Disconnection | Client socket drops       | Workflow continues   | History reflects accurate|
| during execution      |                           | durably on backend   | completed state on reload|
+-----------------------+---------------------------+----------------------+--------------------------+
```

---

## 17. Architectural Decision Records (ADR)

### ADR-001: Selection of FastAPI & Python 3.12 for Backend Orchestration
- **Status:** Accepted.
- **Context:** The system requires asynchronous HTTP calls, robust validation schemas, and predictable background workflow processing.
- **Decision:** Use FastAPI with Pydantic v2 and HTTPX async client.
- **Consequences:** Provides native async I/O, OpenAPI documentation out-of-the-box, type safety, and clean modular architecture without heavy enterprise overhead.

### ADR-002: Next.js App Router with shadcn/ui and Anime.js for UI
- **Status:** Accepted.
- **Context:** Need accessible, headless design primitives with fluid micro-interactions and fast initial load times.
- **Decision:** Use Next.js with Tailwind CSS, shadcn/ui (Radix primitives), and Anime.js.
- **Consequences:** Eliminates bulky UI library runtime overhead; provides full accessibility (WCAG AA); enables custom choreographed timelines.

### ADR-003: Supabase PostgreSQL for Relational Audit Persistence
- **Status:** Accepted.
- **Context:** History and step-level metrics must remain immutable and searchable even after remote repositories are deleted.
- **Decision:** Supabase PostgreSQL with SQLAlchemy 2.0 asyncpg ORM and Alembic migrations. GitHub OAuth remains the exclusive login provider.
- **Consequences:** Guarantees relational integrity, fast indexed JSON queries, and persistent historical tracking without reliance on ephemeral storage.

---

## 18. Conclusion & Implementation Readiness

This architecture document fully addresses all functional, non-functional, security, and interface requirements defined in `PRD.md`. The design guarantees zero-leakage token security, strict single-user authorization, fail-safe destructive operations, and fluid user interactions.

The project is approved for engineering implementation following the specified directory hierarchy and component contracts.
