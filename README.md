# GitAuto — GitHub Repository Lifecycle Automation System

**GitAuto** is a production-grade, single-user developer platform designed for automating GitHub repository provisioning, boilerplate scaffolding, and strictly verified lifecycle teardowns with persistent audit logging.

Built in accordance with the project specifications documented in `PRD.md`, `ARCHITECTURE.md`, and `DESIGN.md`.

---

## 1. Features & Capabilities

- **Single-Tenant Allowlisted Authentication:** Exclusive GitHub OAuth 2.0 with PKCE (`S256`) flow. Only the pre-configured allowlisted GitHub username (`AUTHORIZED_GITHUB_USER`) is permitted access.
- **Task 1: Automated Repository Provisioning & Scaffolding:**
  - One-click remote repository creation under authenticated account (Public / Private).
  - Custom or templated `README.md` and standard `.gitignore` (`Node`, `Python`, `Go`, `Rust`, `None`) generation.
  - Multi-step asynchronous workflow orchestrator with commit SHA verification on default branch HEAD.
  - Partial-failure isolation: If scaffolding fails after creation, repository remains intact with `PARTIAL_FAILURE` status and is **never** automatically deleted.
  - Dry-run / preview simulation mode.
- **Task 2: Governed Destructive Teardown (Safe Deletion):**
  - Restricts deletion exclusively to application-tracked repositories.
  - Double-confirmation safety interlock requiring the user to type the exact repository name.
  - Asserts immutable GitHub repository ID (`github_repository_id`) against remote GitHub API before issuance.
  - Confirms remote 404 deletion and updates registry status.
  - 100% execution history and audit logs remain preserved even after remote deletion.
- **Persistent Historical Observability & Search:**
  - Complete step-level audit timelines with durations, HTTP status codes, and sanitized payload snapshots.
  - Real-time search by repository name or execution ID.
  - Multi-filtering by status, workflow type, date range, and sorting.
  - One-click JSON audit log export.
- **Developer-First Design System (21st.dev inspired):**
  - Deep Zinc monochrome surfaces, hairline `1px` structural borders, and Geist typography.
  - High-performance Anime.js micro-interactions respecting `prefers-reduced-motion`.
  - Dark / Light / System theme modes with persistent preference storage.

---

## 2. Architecture & Technology Stack

```
+----------------------------------------------------------------------------------------------------+
| Layer                 | Technology Stack                  | Specification                          |
+-----------------------+-----------------------------------+----------------------------------------+
| Frontend Framework    | Next.js 14+ (App Router)          | React 18, TypeScript, Tailwind CSS     |
| UI Design Primitives  | shadcn/ui (Radix primitives)      | Lucide Icons, Custom Zinc Tokens       |
| Micro-Interactions    | Anime.js                          | Fluid transitions, reduced-motion safe |
| Backend API Engine    | FastAPI (Python 3.12+)            | Asynchronous REST API, Pydantic v2     |
| Database / ORM        | SQLAlchemy 2.0 (Async)            | PostgreSQL (Supabase) / SQLite Async   |
| GitHub REST Client    | HTTPX (Async)                     | GitHub REST API v3, Rate Limit Tracking|
| Security & Cipher     | PyCA Cryptography (AES-256-GCM)   | PyJWT HMAC-SHA256, PKCE (S256)         |
| Test Suite            | pytest, pytest-asyncio, respx     | 100% Mocked & Integration Tests        |
+-----------------------+-----------------------------------+----------------------------------------+
```

---

## 3. Getting Started & Local Development

### 3.1 Prerequisites
- **Node.js**: `>= 18.18.0` (tested on Node v20/v24)
- **Python**: `>= 3.10` (tested on Python 3.12 / 3.14)
- **npm** or **pnpm**
- Registered GitHub OAuth Application (obtain `Client ID` and `Client Secret` at [GitHub Developer Settings](https://github.com/settings/developers))

### 3.2 Environment Configuration
Copy the configuration template:
```bash
cp .env.example .env
```
Configure `.env` with your values:
```env
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Security Secrets
SESSION_SECRET=your_32_byte_session_secret_key_here
MASTER_ENCRYPTION_KEY=your_32_byte_encryption_key_here

# GitHub OAuth App
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_REDIRECT_URI=http://localhost:8000/api/v1/auth/github/callback
AUTHORIZED_GITHUB_USER=your_github_username

# Database (SQLite by default, or Postgres)
DATABASE_URL=sqlite+aiosqlite:///./gitauto.db
```

---

### 3.3 Backend Setup & Execution

1. Navigate to `backend/` and set up the Python virtual environment:
```bash
cd backend
python -m venv .venv

# On Linux / macOS:
source .venv/bin/activate
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

2. Run the FastAPI backend server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at `http://localhost:8000/docs` and `http://localhost:8000/redoc`.

---

### 3.4 Frontend Setup & Execution

1. In a separate terminal, navigate to `frontend/`:
```bash
cd frontend
npm install
npm run dev
```

2. Open `http://localhost:3000` in your browser.

---

## 4. Running Automated Tests

Run the complete backend test suite:
```bash
# From project root
.\backend\.venv\Scripts\pytest.exe backend/tests/ -v
```

Run frontend production build & type check:
```bash
cd frontend
npm run build
```

---

## 5. REST API Specification

| Endpoint | Method | Purpose | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/github/login` | `GET` | Initiates OAuth 2.0 PKCE challenge | No |
| `/api/v1/auth/github/callback` | `GET` | OAuth callback, allowlist validation & JWT session cookie | No |
| `/api/v1/auth/me` | `GET` | Returns authenticated user profile & rate limit health | Yes |
| `/api/v1/auth/logout` | `POST` | Invalidates session and clears cookie | Yes |
| `/api/v1/dashboard/summary` | `GET` | Aggregated telemetry metrics & 5 recent runs | Yes |
| `/api/v1/automations` | `POST` | Triggers Task 1 (Create repo + initial content push) | Yes |
| `/api/v1/automations/{id}` | `GET` | Returns execution status & step timeline | Yes |
| `/api/v1/automations/{id}/cancel` | `POST` | Cancels an in-progress execution | Yes |
| `/api/v1/repositories` | `GET` | Lists all application-managed repositories | Yes |
| `/api/v1/repositories/{id}` | `GET` | Retrieves repository metadata | Yes |
| `/api/v1/repositories/{id}/preflight`| `GET` | Deletion safety verification check | Yes |
| `/api/v1/repositories/{id}/delete` | `POST` | Triggers Task 2 (Safe deletion with double-confirmation) | Yes |
| `/api/v1/history` | `GET` | Paginated, filtered, searchable execution audit logs | Yes |
| `/api/v1/history/{id}` | `GET` | Detailed step trace with sanitized payload snapshots | Yes |
| `/api/v1/history/export` | `GET` | Exports complete audit logs as JSON | Yes |
| `/api/v1/settings` | `GET` / `PATCH` | Manages repository defaults & automation preferences | Yes |
| `/api/v1/settings/github` | `GET` | Live GitHub API quota and scopes monitor | Yes |
| `/health` / `/ready` | `GET` | Health probes for container orchestration | No |

---

## 6. Security Guarantees & Safeguards

1. **Strict Identity Allowlist:** Only logins matching `AUTHORIZED_GITHUB_USER` are granted access. Any other GitHub account is rejected with `403 Forbidden` and no session is created.
2. **Encrypted Token Storage:** GitHub access tokens are encrypted at rest using AES-256-GCM. Plaintext tokens are never stored in databases or exposed in client bundles.
3. **HTTP-Only Session Cookies:** Session tokens are transmitted exclusively in `HttpOnly`, `SameSite=Lax` cookies.
4. **Header & Log Sanitization:** All internal loggers and error responses scrub `Authorization`, `Cookie`, and secret values.
5. **Double-Confirmation Deletion:** Destructive actions require typing the exact repository name and verifying the immutable GitHub repository ID. Non-managed repositories cannot be deleted.

---

## 7. License & Credits

Built for secure, reliable personal GitHub repository automation.
Designed following the aesthetic standards of **21st.dev**.
