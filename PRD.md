# Product Requirements Document (PRD)

## Project: GitHub Repository Lifecycle Automation System (GitAuto)

**Document Version:** 1.0.0  
**Status:** Approved / Ready for Architecture & Implementation  
**Author:** Senior Product Manager & Technical Requirements Team  
**Date:** November 2026  

---

### 1. Executive Summary

The **GitHub Repository Lifecycle Automation System** (`GitAuto`) is a specialized, private personal dashboard engineered to automate and monitor GitHub repository lifecycle operations with enterprise-grade auditability, precision, and safety. 

Modern developers frequently perform repetitive repository scaffolding, baseline file provisioning (e.g., standard `README.md`, `.gitignore`), and subsequent decommission/cleanup workflows. Manual execution is error-prone, lacks centralized audit logs, and risks accidental deletion of critical assets. `GitAuto` provides a single-user, authenticated web application that integrates directly with the GitHub REST/GraphQL APIs. It executes controlled repository creation, atomic initial content commits, explicit and protected repository deletion workflows, and maintains a persistent, immutable historical log of every execution step regardless of downstream repository state.

---

### 2. Product Vision & Problem Statement

#### 2.1 Product Vision
To provide individual software engineers with an intuitive, reliable, and secure single-pane-of-glass interface for managing lifecycle automations of personal GitHub repositories, backed by immutable audit history and strict safety guardrails against accidental data loss.

#### 2.2 Problem Statement
- **Repetitive Scaffolding Overhead:** Developers regularly spin up experimental, template, or utility repositories, repeatedly configuring licenses, `.gitignore`, initial branch structures, and boilerplate documentation.
- **Absence of Centralized Execution Audit:** Native GitHub web interfaces and ad-hoc local scripts do not record detailed step-by-step lifecycle logs, durations, API statuses, and execution metadata in a centralized searchable dashboard.
- **Risk of Accidental Data Deletion:** Deleting repositories via ad-hoc scripts or ambiguous UIs carries severe risks of removing the wrong repository or deleting assets without a verifiable audit trail.
- **Misconceptions & Compliance:** Automations must maintain strict separation of concerns, transparency in API actions, and explicitly avoid artificial or manipulative contribution schemes, adhering cleanly to GitHub Acceptable Use Policies.

---

### 3. Target Audience & User Personas

#### 3.1 Target Audience Matrix

| Segment | Description | Key Needs |
| :--- | :--- | :--- |
| **Primary Audience** | Individual GitHub Account Owners & Developers | Automated repository provisioning, standardized boilerplate generation, centralized execution logs, safe deletion controls. |
| **Secondary Audience** | DevOps Engineers & API Integrators | Reference implementation for GitHub OAuth, Webhook/API lifecycle workflows, and structured audit persistence. |

*Note: GitAuto is intentionally architected as a private, single-tenant / allowlisted single-user tool, not a multi-tenant public SaaS platform.*

#### 3.2 User Personas

##### Persona 1: Alex — The Prototyping Engineer
- **Role:** Senior Full-Stack Engineer / Independent Maker
- **Context:** Creates 5–10 prototype and sandbox repositories per month. Needs consistent initial configurations and quick, safe decommissioning once experiments conclude.
- **Pain Points:** Manually typing README headers, selecting `.gitignore` templates, losing track of what was created, and accidentally deleting the wrong repo when cleaning up.
- **Goal:** Launch a standardized repository in 1 click, inspect real-time creation progress, and safely tear it down later with explicit confirmation.

##### Persona 2: Maya — The Tooling & API Specialist
- **Role:** Backend Developer / Automations Engineer
- **Context:** Requires an auditable interface to verify GitHub API response codes, payload statuses, and timing metrics for automated repository operations.
- **Pain Points:** Command-line scripts fail silently or don't preserve structured error logs when GitHub rate-limits or rejects requests.
- **Goal:** Inspect full execution timelines with step-by-step API responses, latency measurements, and timestamped events in local time.

---

### 4. Product Objectives & Value Proposition

1. **Automate Repository Provisioning:** Eliminate manual repository creation and initial commit boilerplate through configurable single-action workflows.
2. **Guaranteed Destructive Operation Safety:** Ensure zero unauthorized or accidental repository deletions by restricting deletions strictly to tracked repositories, requiring double-confirmation and immutable ID matching.
3. **Comprehensive Execution Auditing:** Persist 100% of automation event logs, timing metrics, and API responses in a local relational database, retaining history even if the remote repository is subsequently deleted.
4. **Single-User Security & Allowlist Authorization:** Restrict access strictly via GitHub OAuth2 matching a pre-configured owner allowlist, preventing guest or unauthorized multi-user access.
5. **Transparency & Integrity:** Clearly decouple creation and deletion into distinct tasks; never claim or guarantee artificial GitHub contribution square increments.

---

### 5. User Journeys & Workflow Diagrams

#### 5.1 Journey 1: Secure Authentication & Dashboard Onboarding
1. User navigates to the application URL (`/`).
2. If unauthenticated, the system immediately redirects to `/login`.
3. User clicks **"Continue with GitHub"**.
4. GitHub OAuth consent screen requests authorization with required scopes (`repo`, `read:user`, `user:email`).
5. Upon callback, the backend validates user identity against the server's configured GitHub username allowlist.
   - *If matched:* User session cookie (HTTP-only, Secure, SameSite) is issued; user redirected to `/dashboard`.
   - *If mismatched:* Session is rejected; user redirected to an Unauthorized Access error view with instructions.

#### 5.2 Journey 2: Task 1 — Repository Creation & Initial Content Scaffolding
1. User clicks **"New Automation"** on `/dashboard` or navigates to `/automations/new`.
2. User selects **"Create Repository & Push Content"** workflow.
3. User configures:
   - Repository Name (auto-validated for GitHub naming rules and prefix rules).
   - Visibility (`public` or `private`).
   - Description.
   - Default Branch (e.g., `main`).
   - Initial README title and body template.
   - Initial `.gitignore` language template (e.g., `Node`, `Python`, `Go`, `None`).
4. User initiates execution (or runs Dry-Run Preview).
5. Frontend opens real-time execution monitor (`/history/[executionId]`).
6. System steps executed sequentially:
   - *Step 1:* Verify active GitHub authentication & rate limits.
   - *Step 2:* POST `/user/repos` to create remote repository.
   - *Step 3:* Capture and store immutable repository ID, node ID, and clone URLs.
   - *Step 4:* Generate initial commit contents (`README.md`, `.gitignore`).
   - *Step 5:* PUT `/repos/{owner}/{repo}/contents/{path}` or Git Data API to commit initial content.
   - *Step 6:* Verify remote commit SHA and branch HEAD.
   - *Step 7:* Mark execution `SUCCESS` and update local repository registry.

#### 5.3 Journey 3: Task 2 — Explicit & Safe Repository Deletion
1. User navigates to `/repositories` or `/automations/new` (Task: Delete Repository).
2. User views list of repositories **created by this application**.
3. User clicks **"Delete Repository"** on a target repository.
4. System presents a Destructive Action Modal displaying:
   - Repository Name, Remote GitHub ID, Creation Date, and Commit Count.
   - Warning banner that deletion is irreversible.
   - Input requirement: User must type the exact repository name to confirm.
5. User confirms deletion.
6. System executes:
   - *Step 1:* Verify repository ownership and immutable GitHub ID.
   - *Step 2:* Issue DELETE `/repos/{owner}/{repo}` to GitHub API.
   - *Step 3:* Verify deletion via GET `/repos/{owner}/{repo}` (expecting 404).
   - *Step 4:* Record deletion timestamp, actor, and verification details in audit log.
   - *Step 5:* Mark local repository status as `DELETED` while retaining full execution history.

---

### 6. Functional Requirements (FR)

| Requirement ID | Module | Title | Priority | Description & Expected Behavior | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Auth | GitHub OAuth Integration | **P0** | System must authenticate users exclusively via GitHub OAuth 2.0 with scopes `repo`, `read:user`, `user:email`. | Only GitHub login button is present; no password or third-party alternative forms. |
| **FR-002** | Auth | Authorized Account Allowlist | **P0** | System must compare authenticated GitHub username with `AUTHORIZED_GITHUB_USER` environment variable. | Unauthorized accounts receive HTTP 403 / Access Denied screen with no session token issued. |
| **FR-003** | Auth | Session Management & Route Guard | **P0** | Unauthenticated requests to private routes (`/dashboard`, `/automations/*`, `/history/*`, `/repositories`, `/settings/*`) must redirect to `/login`. | Direct URL navigation to protected routes without a valid session cookie redirects to `/login`. |
| **FR-004** | Auth | Session Expiration & Logout | **P0** | User can manually log out to invalidate server session. System handles expired/revoked GitHub tokens gracefully. | Clicking "Log Out" clears session cookie; expired token prompts re-authentication modal. |
| **FR-005** | Dashboard | Metrics & System Overview | **P1** | Dashboard displays user avatar, username, connection status, total runs, success/fail counts, created repos, and deleted repos count. | All metric cards render accurate counts derived from the local audit database. |
| **FR-006** | Dashboard | Quick Actions & Recent Activity | **P1** | Dashboard provides prominent CTA for new automations and a table of the 5 most recent executions with status badges. | Clicking CTA routes to `/automations/new`; clicking any row opens `/history/[executionId]`. |
| **FR-007** | Automation | Repository Creation Workflow | **P0** | Allows user to configure name, visibility (`public`/`private`), description, and default branch, then creates repo via GitHub API. | POST request sent to GitHub API; returns 201 Created and persists repo ID & metadata. |
| **FR-008** | Automation | Initial Content Generation & Commit | **P0** | Generates `README.md` and optional `.gitignore`, pushing them as the initial commit on the default branch. | Remote repository contains the generated files and a valid commit SHA within 10 seconds of creation. |
| **FR-009** | Automation | Workflow Step-by-Step Execution Engine | **P0** | Executes workflow steps sequentially, recording timestamp, duration, payload status, and errors per step. | Each step logs distinct status (`PENDING`, `IN_PROGRESS`, `SUCCESS`, `FAILED`) in database. |
| **FR-010** | Automation | Dry-Run / Preview Mode | **P1** | Provides preview of API payloads, target repository URL, and files to be committed before execution. | User can toggle "Dry Run" to validate parameters and simulated payloads without invoking GitHub mutations. |
| **FR-011** | Automation | Safe Repository Deletion Workflow | **P0** | Allows deletion of only repositories previously created and tracked by GitAuto after mandatory double confirmation. | System prompts modal requiring exact repo name match; issues DELETE request and validates 404 response. |
| **FR-012** | Automation | Prevention of Arbitrary Deletion | **P0** | System strictly forbids deletion of any repository not registered in GitAuto's creation database. | Manual API invocation or UI tampering targeting non-tracked repositories is rejected with HTTP 403/400. |
| **FR-013** | History | Execution Audit Persistence | **P0** | Complete execution details must be stored in database and persist indefinitely, even after remote repo deletion. | Deleting a repository does not cascade-delete or purge its creation or deletion audit logs. |
| **FR-014** | History | Search & Multi-Filter Engine | **P1** | User can search execution history by repo name, execution ID, workflow name, status, operation type, and date range. | Search query filters results accurately with pagination, sorting (newest/oldest), and result count display. |
| **FR-015** | History | Step-Level Execution Timeline | **P1** | Dedicated view (`/history/[executionId]`) displaying detailed timeline of every step, duration, and API response status code. | Step timeline displays accurate status badges, start/end timestamps in local time, and error details if failed. |
| **FR-016** | Repository | Tracked Repositories Registry | **P1** | View (`/repositories`) listing all created repositories with current lifecycle state (`ACTIVE`, `DELETED`, `PARTIAL_FAILURE`). | Repositories table shows creation date, visibility, GitHub link, and contextual "Delete" action if active. |
| **FR-017** | Settings | Account & Automation Preferences | **P2** | Manage default repository visibility, naming prefix, default `.gitignore` selection, and timezone preferences. | Changes to defaults persist in user settings and auto-populate new automation forms. |
| **FR-018** | Notifications | Toast & Banner Alerting | **P1** | In-app notification system reporting workflow success, failures, token expirations, and API rate-limit alerts. | Actionable, clear toast messages appear on operation trigger, completion, and error states. |

---

### 7. Non-Functional Requirements (NFR)

#### 7.1 Performance Requirements
- **NFR-P1 (Page Load Time):** Initial dashboard and history pages must achieve First Contentful Paint (FCP) < 1.0s and Time to Interactive (TTI) < 1.5s on broadband connections.
- **NFR-P2 (API Execution Latency):** Server-side automation orchestrator must dispatch GitHub API calls with < 50ms overhead per step (excluding GitHub external network latency).
- **NFR-P3 (Query & Pagination Optimization):** History queries must use indexed database columns (`executionId`, `repositoryName`, `status`, `createdAt`) ensuring query response times < 50ms for datasets up to 100,000 records.
- **NFR-P4 (Payload Efficiency):** History list views must paginate in batches of 10, 25, or 50 records to prevent excessive DOM rendering.

#### 7.2 Security Requirements
- **NFR-S1 (Token Protection):** GitHub OAuth access tokens and client secrets must never be sent to the browser or stored in plain-text client storage. Server must store tokens in encrypted sessions or encrypted database columns using AES-256-GCM.
- **NFR-S2 (Strict Allowlist Enforcement):** Access is restricted to the specific authorized GitHub username. Unauthorized GitHub users are rejected at the OAuth callback stage.
- **NFR-S3 (CSRF & State Verification):** OAuth 2.0 flow must employ cryptographic `state` parameters verified in HTTP-only cookies to prevent cross-site request forgery.
- **NFR-S4 (Input Validation & Sanitization):** All user inputs (repository names, descriptions, branches) must be sanitized and validated against strict GitHub naming regex (`^[a-zA-Z0-9._-]+$`).
- **NFR-S5 (Zero Secret Logging):** Application logging frameworks must sanitize payloads to prevent printing OAuth tokens, authorization headers, or sensitive cookies into log streams.

#### 7.3 Reliability & Fault Tolerance
- **NFR-R1 (Atomicity & Partial Failure Handling):** If repository creation succeeds but initial content commit fails, the repository must **not** be deleted automatically. The workflow must be flagged as `PARTIAL_FAILURE` with a dedicated retry option for the content push step.
- **NFR-R2 (Idempotency):** Automation retry operations must be idempotent to prevent duplicate repository creation attempts.
- **NFR-R3 (Audit Immutability):** Historical execution records are append-only. Modifying or deleting audit history records via application APIs is strictly prohibited.
- **NFR-R4 (Graceful Degradation):** In case of GitHub API rate limits (HTTP 403/429), the system must extract `x-ratelimit-reset` headers and display clear user warnings with exact reset cooldown timers.

#### 7.4 Usability & Accessibility
- **NFR-U1 (Responsive Design):** The UI must be fully responsive across mobile (375px+), tablet (768px+), and desktop (1280px+) viewport widths.
- **NFR-U2 (Clear Visual Hierarchy):** Destructive actions (repository deletion) must use distinct warning styling (destructive red colors, explicit confirmation dialogs, non-dismissible backdrop).
- **NFR-U3 (Accessible Indicators):** All status badges (`SUCCESS`, `FAILED`, `IN_PROGRESS`, `PENDING`) must combine color coding with unambiguous text and iconography for accessibility (WCAG 2.1 AA compliant contrast).

#### 7.5 Maintainability & Architecture
- **NFR-M1 (Modular Decoupled Design):** Architecture must separate UI components, API route handlers, GitHub client service wrappers, and database repositories.
- **NFR-M2 (Strict Typing & API Contracts):** Frontend and backend must share TypeScript data transfer objects (DTOs) and Zod schema validations for all workflow parameters.

---

### 8. Feature Specifications

#### 8.1 Authentication & Authorization (`/login`)
- **Login Screen UI:**
  - Application logo, name ("GitAuto"), and concise subtitle ("Personal GitHub Lifecycle Automation").
  - Prominent "Continue with GitHub" button with GitHub Octocat icon.
  - Informational badge: "Private Allowlisted Instance".
  - Loading spinner state during OAuth redirect.
  - Dedicated error notification container for OAuth errors (e.g., `access_denied`, `unauthorized_account`).
- **Authorization Engine:**
  - Validates GitHub OAuth response.
  - Matches authenticated user login against `AUTHORIZED_GITHUB_USER`.
  - Sets secure HTTP-only session cookie upon match.

#### 8.2 Dashboard (`/dashboard`)
- **Header Profile Card:**
  - User avatar, GitHub handle, linked account status indicator ("Connected / Healthy"), and quick link to external GitHub profile.
- **Summary Metrics Grid:**
  - Total Automations Executed.
  - Success Rate (% and count).
  - Failed Runs count.
  - Active Repositories Created by GitAuto.
  - Total Repositories Decommissioned / Deleted.
- **Quick Action Bar:**
  - "New Automation" primary CTA button.
  - "View Repositories" secondary CTA button.
- **Recent Automation Activity:**
  - Table displaying the last 5 operations with columns: ID, Workflow, Target Repo, Started At, Duration, Status Badge, and Action Link.

#### 8.3 Automation Workflow Management (`/automations`, `/automations/new`)
- **Workflow Selector:**
  - Option A: **Create Repository & Scaffold Initial Content** (Task 1).
  - Option B: **Delete Created Repository** (Task 2).
- **Configuration Form (Task 1 - Creation):**
  - *Repository Name:* Text input with real-time validation and prefix toggle (e.g., `sandbox-`, `demo-`, or custom).
  - *Visibility:* Radio toggle (`Public` vs `Private`).
  - *Description:* Optional string input (max 350 chars).
  - *Default Branch:* Text input (default: `main`).
  - *Initialize README:* Toggle (default: enabled). Editable Markdown title and body template.
  - *Initialize .gitignore:* Dropdown selector with templates (`Node`, `Python`, `Go`, `Rust`, `Java`, `None`).
  - *Dry-Run Preview Toggle:* Checkbox to preview execution steps without modifying GitHub.
- **Execution Progress Modal / Live View:**
  - Real-time step progress indicator (Step 1 to Step 6).
  - Visual status icon per step: spinner for in-progress, checkmark for completed, red cross for failed.
  - Direct link to created repository upon completion.

#### 8.4 Destructive Deletion Workflow (Task 2 - Deletion)
- **Target Selection:**
  - Searchable dropdown or list restricted strictly to active repositories created by GitAuto.
- **Safety Interlock Modal:**
  - Displays Repository Full Name (e.g., `username/sandbox-demo-app`).
  - Displays GitHub Node ID and Creation Timestamp.
  - Displays explicit warning: *"This action cannot be undone. All branches, commits, issues, and settings on GitHub will be permanently deleted."*
  - Confirmation Input: User must type the exact repository name.
  - "Confirm & Delete Repository" button is disabled until the input exactly matches the repository name.
- **Deletion Execution Engine:**
  - Executes API deletion request.
  - Polls GitHub API to verify 404 status.
  - Marks local repository state as `DELETED` and appends deletion log record.

#### 8.5 Execution History & Audit Log (`/history`)
- **Search & Filter Toolbar:**
  - Text search: Repository Name, Execution ID.
  - Status Filter: `All`, `SUCCESS`, `FAILED`, `IN_PROGRESS`, `PARTIAL_FAILURE`.
  - Operation Type Filter: `All`, `REPO_CREATE`, `CONTENT_PUSH`, `REPO_DELETE`.
  - Date Range Picker: From Date — To Date.
  - Reset Filters button.
- **History Data Table:**
  - Columns: Execution ID, Operation, Repository Name, Started At (Local Time), Duration (ms/sec), Status, Details Link.
  - Pagination Controls: 10, 25, 50 rows per page with previous/next navigation.

#### 8.6 Execution Details & Timeline (`/history/[executionId]`)
- **Execution Summary Header:**
  - Execution ID, Target Repository, Overall Status, Total Duration, Initiated Timestamp, Completed Timestamp.
- **Step-by-Step Chronological Timeline:**
  - Step Title & Description.
  - Duration in milliseconds.
  - HTTP Request Method and Endpoint (e.g., `POST https://api.github.com/user/repos`).
  - HTTP Response Status Code (e.g., `201 Created`, `422 Unprocessable Entity`).
  - Sanitized Error Message / Stack Trace if step failed.
  - Deletion Confirmation Snapshot (if operation was deletion).

#### 8.7 Repository Registry (`/repositories`)
- **Tracked Repositories View:**
  - Table of all repositories managed by GitAuto.
  - Status column: `ACTIVE`, `DELETED`, `PARTIAL_FAILURE`.
  - Quick action: "Delete" button (active only for `ACTIVE` repositories).
  - Quick action: "Retry Scaffolding" (active only for `PARTIAL_FAILURE` repositories).
  - Link to GitHub remote repository (if active).

#### 8.8 Settings & Configuration (`/settings`, `/settings/github`)
- **GitHub Connection Card:**
  - Connected account name, avatar, OAuth token status, granted scopes list, and rate limit quota status (remaining / total calls).
- **Automation Defaults:**
  - Default repository visibility preference (`Private` vs `Public`).
  - Default repository naming prefix (e.g., `auto-`).
  - Default `.gitignore` template.
  - Default README template header.
- **Timezone Settings:**
  - Timezone selector for timestamp rendering (default: Browser Local Timezone).
- **Session Actions:**
  - Active Session Info (IP/User Agent if logged, login timestamp).
  - "Log Out" button.

---

### 9. Application Route Architecture

```
/
├── /login                          [Public] GitHub OAuth login & status check
├── /api/auth/github                [Public] Initiates GitHub OAuth redirect
├── /api/auth/callback              [Public] Handles GitHub OAuth callback & allowlist verification
├── /api/auth/logout                [Private] Clears session and redirects to /login
│
├── /dashboard                      [Private] Overview metrics, quick actions, recent activity
│
├── /automations                    [Private] Automation workflow catalog & status
│   └── /automations/new            [Private] Workflow launcher & configuration form
│
├── /history                        [Private] Searchable & filterable execution audit logs
│   └── /history/[executionId]      [Private] Detailed step-by-step timeline for a specific run
│
├── /repositories                   [Private] Registry of repositories created by GitAuto
│
└── /settings                       [Private] Application preferences & defaults
    └── /settings/github            [Private] GitHub connection details & API rate limits
```

*Route Security Guard: Every route under `[Private]` requires an active, authenticated, allowlisted session. Unauthenticated requests are intercepted and redirected to `/login` with return URL preservation.*

---

### 10. Business Rules & Safety Policies

1. **BR-001 (Strict Operation Decoupling):** Task 1 (Creation & Content Push) and Task 2 (Repository Deletion) are strictly independent operations. Creation must never trigger an automatic deletion timer or scheduled deletion.
2. **BR-002 (Explicit Deletion Confirmation):** Repository deletion requires manual trigger and explicit confirmation (typing exact repository name). Zero one-click or bulk deletions are permitted.
3. **BR-003 (Scope of Deletion Authority):** The system shall only delete repositories that have a registered creation record in GitAuto's database with matching immutable GitHub repository IDs (`id` and `node_id`). Deletion of external or pre-existing repositories is strictly rejected.
4. **BR-004 (Immutable Audit History):** Deleting a repository from GitHub does not delete or purge its execution history from GitAuto. The database record is updated to reflect remote deletion (`status = DELETED`), retaining full historical logs.
5. **BR-005 (Partial Failure Policy):** If repository creation succeeds on GitHub, but initial content commit fails:
   - The repository must **not** be deleted.
   - The execution is marked `PARTIAL_FAILURE`.
   - The system records the remote repository metadata.
   - The user is notified with specific error context and provided a manual "Retry Content Push" action.
6. **BR-006 (Contribution Square Disclaimers):** The application must never state or imply that lifecycle automations guarantee or manipulate GitHub contribution graph activity.

---

### 11. Edge Cases & Error Handling Matrix

| Scenario / Edge Case | System Detection | Impact | Automated System Behavior | User Notification & Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **EC-01: Unauthorized GitHub Login** | OAuth username does not match `AUTHORIZED_GITHUB_USER`. | Auth blocked. | Immediately terminates OAuth session without writing session cookie. | Redirects to `/login?error=unauthorized_account`. Displays "Your GitHub account is not authorized to access this private instance." |
| **EC-02: Expired / Revoked GitHub Token** | GitHub API returns `401 Unauthorized` or `Bad credentials`. | API calls fail. | Marks GitHub connection status as `DISCONNECTED`; halts pending workflow. | Displays modal: "GitHub authorization has expired. Please re-authenticate." Redirects to `/login`. |
| **EC-03: GitHub API Rate Limit Reached** | GitHub API returns `403 Forbidden` with header `x-ratelimit-remaining: 0`. | Cannot create/delete repos. | Halts execution step; parses `x-ratelimit-reset` timestamp; records `RATE_LIMITED` status. | Toast and Banner notification: "GitHub API rate limit exceeded. Resets at [HH:mm:ss local time]." |
| **EC-04: Repository Name Already Exists** | GitHub API returns `422 Unprocessable Entity` (`name already exists`). | Repo creation fails. | Halts workflow before commit step; records failure with API response payload. | Inline form error on `/automations/new`: "A repository with this name already exists on your GitHub account. Choose another name." |
| **EC-05: Creation Succeeds, Content Push Fails** | Step 1 (`POST /user/repos`) returns 201; Step 2 (`PUT /contents`) returns 4xx/5xx or timeouts. | Repo exists but is empty. | Prevents auto-deletion; saves repo record with status `PARTIAL_FAILURE`; logs failed step. | Warning modal: "Repository created, but initial file push failed ([Error Detail]). You can retry file initialization from the repository dashboard." |
| **EC-06: GitHub API Timeout / Network Drop** | HTTP client timeout (> 15 seconds) during API call. | Step state indeterminate. | Marks step as `TIMED_OUT`; queries GitHub API to check if resource was created before retrying. | "Request timed out while contacting GitHub. Verifying remote state..." Provides manual verification/retry option. |
| **EC-07: Browser Closed / Refreshed During Execution** | Client disconnects while backend execution runs. | UI disconnects. | Backend completes execution asynchronously; updates database record normally. | Upon next visit to `/history` or `/dashboard`, user sees the completed or failed status with full logs. |
| **EC-08: Duplicate Form Submission** | User rapidly double-clicks "Create Repository" button. | Risk of race condition. | UI disables button on first click; backend applies idempotency key / unique constraint on execution request. | Second request is rejected cleanly; UI follows the active execution progress. |
| **EC-09: Repository Deleted Outside GitAuto** | User manually deletes repository directly on github.com, then attempts deletion in GitAuto. | Target repo missing on remote. | GitAuto queries GitHub API; receives `404 Not Found`; logs external deletion; updates local status to `DELETED_EXTERNALLY`. | Information notice: "Repository was already removed from GitHub. Local status has been updated to Deleted." |
| **EC-10: Database Unavailable** | Local database connection drops or times out. | Cannot read/write logs. | Backend returns HTTP 500; blocks any new automation from starting without persistence. | Error screen: "Internal Storage Error. Automation operations are paused until database connectivity is restored." |

---

### 12. Security & Destructive Operation Policy

```
+-----------------------------------------------------------------------------------+
|                        DESTRUCTIVE OPERATION SAFETY POLICY                        |
+-----------------------------------------------------------------------------------+
| 1. SCOPE RESTRICTION                                                              |
|    - GitAuto can NEVER delete repositories outside its tracked database.          |
|    - Target repository must have a valid `gitauto_repository_id` record.          |
|                                                                                   |
| 2. IDENTITY & IMMUTABILITY CHECK                                                  |
|    - Target repository `owner` must match the authenticated user.                |
|    - Target repository `node_id` must match the initial creation record.          |
|                                                                                   |
| 3. MANDATORY HUMAN CONFIRMATION                                                   |
|    - Deletion can NEVER be triggered via query parameter or single click.         |
|    - User must manually type the full repository name into confirmation input.    |
|                                                                                   |
| 4. AUDIT PRESERVATION                                                             |
|    - Every deletion attempt (success, failure, or rejected) is recorded.         |
|    - History records are permanent and never deleted.                             |
|                                                                                   |
| 5. CREDENTIAL ISOLATION                                                           |
|    - No access tokens logged in plain text or rendered in browser DOM.            |
+-----------------------------------------------------------------------------------+
```

---

### 13. Out of Scope Features (Release 1.0)

The following capabilities are explicitly excluded from the initial release to maintain focus, security, and simplicity:
- **Public Multi-User Registration:** No signup forms, organization memberships, or multi-tenant user isolation.
- **Multi-Organization Management:** Operations are confined to the authenticated user's personal GitHub account namespace.
- **Multiple GitHub Account Switching:** Single connected account per instance.
- **GitHub Actions & CI/CD Pipeline Configuration:** Workflow does not configure GitHub Actions workflows, secrets, or runners.
- **Artificial / Automated Commit Inflation:** No recurring cron jobs or scheduled dummy commits for contribution graph manipulation.
- **Bulk Repository Management:** No multi-select batch deletion or bulk repo generator.
- **Arbitrary External Repository Deletion:** No deletion of repos created outside GitAuto.
- **Repository Branch Protection & Webhook Administration:** Fine-grained branch rules and custom webhooks are out of scope.

---

### 14. Data Model & Entity Specifications

```
+-----------------------------------------------------------------------------------+
|                                 ENTITY SCHEMA                                     |
+-----------------------------------------------------------------------------------+

[ UserSession ]
- id: String (UUID, PK)
- githubUserId: String (Unique)
- githubUsername: String (Indexed)
- accessTokenEncrypted: String
- tokenExpiresAt: Timestamp?
- createdAt: Timestamp
- lastActiveAt: Timestamp

[ TrackedRepository ]
- id: String (UUID, PK)
- githubRepoId: BigInt (Unique, Indexed)
- githubNodeId: String (Unique)
- owner: String
- name: String (Indexed)
- fullName: String
- visibility: Enum ('PUBLIC', 'PRIVATE')
- defaultBranch: String
- status: Enum ('ACTIVE', 'DELETED', 'PARTIAL_FAILURE', 'DELETED_EXTERNALLY')
- remoteCreatedAt: Timestamp
- remoteDeletedAt: Timestamp?
- createdAt: Timestamp
- updatedAt: Timestamp

[ AutomationExecution ]
- id: String (UUID, PK, Indexed)
- workflowType: Enum ('CREATE_AND_INITIALIZE', 'DELETE_REPOSITORY')
- repositoryId: String? (FK -> TrackedRepository.id)
- repositoryName: String (Indexed)
- status: Enum ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'PARTIAL_FAILURE')
- triggerSource: Enum ('MANUAL_DASHBOARD', 'RETRY_ACTION')
- isDryRun: Boolean (Default: false)
- startedAt: Timestamp (Indexed)
- completedAt: Timestamp?
- durationMs: Integer?
- errorMessage: String?
- createdAt: Timestamp

[ ExecutionStepLog ]
- id: String (UUID, PK)
- executionId: String (FK -> AutomationExecution.id, Indexed)
- stepNumber: Integer
- stepName: String
- description: String
- status: Enum ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'SKIPPED')
- apiEndpoint: String?
- httpMethod: String?
- httpStatusCode: Integer?
- durationMs: Integer?
- errorDetails: String?
- startedAt: Timestamp
- completedAt: Timestamp?
```

---

### 15. End-to-End Acceptance Criteria

#### 15.1 Authentication & Access Control
- [ ] Navigating to `/` or any private route when unauthenticated redirects to `/login`.
- [ ] Clicking "Continue with GitHub" opens GitHub OAuth consent screen with requested scopes (`repo`, `read:user`, `user:email`).
- [ ] If authenticated GitHub username matches `AUTHORIZED_GITHUB_USER`, user is redirected to `/dashboard` with an HTTP-only session cookie.
- [ ] If authenticated GitHub username does not match, user is redirected to `/login` with an unauthorized account error and no session is created.
- [ ] Clicking "Log Out" invalidates the session and redirects to `/login`.

#### 15.2 Dashboard & Overview Metrics
- [ ] Dashboard displays authenticated user's avatar, username, and connection status.
- [ ] Metric cards show accurate counts for Total Automations, Successes, Failures, Active Tracked Repositories, and Deletions.
- [ ] Recent Activity table displays the 5 most recent runs with accurate status tags.
- [ ] "New Automation" button reliably navigates to `/automations/new`.

#### 15.3 Repository Creation & Content Push (Task 1)
- [ ] User can configure repository name, visibility, description, default branch, README, and `.gitignore` template.
- [ ] Input validation rejects invalid GitHub repository names prior to API request.
- [ ] Executing Task 1 creates the repository on GitHub under the user's account with the specified visibility.
- [ ] Initial commit containing generated `README.md` and `.gitignore` is pushed to the default branch.
- [ ] Real-time execution view reports progress for each step and confirms final commit verification.
- [ ] If content push fails after repo creation, repo remains intact and execution is logged as `PARTIAL_FAILURE`.

#### 15.4 Repository Deletion & Safeguards (Task 2)
- [ ] Only repositories created and tracked by GitAuto appear in the deletion target list.
- [ ] Deletion modal requires the user to type the exact repository name before enabling the confirmation button.
- [ ] Confirming deletion issues a GitHub API delete request, verifies 404 response, and updates local repo status to `DELETED`.
- [ ] History record for the deletion execution is created with full step logs.
- [ ] Prior creation history records for that repository remain intact and searchable.

#### 15.5 Execution History, Search & Filtering
- [ ] `/history` lists all executions with Execution ID, Workflow Name, Target Repository, Timestamp (Local Time), Duration, and Status.
- [ ] Filtering by status (`SUCCESS`, `FAILED`, etc.) and operation type correctly filters the table.
- [ ] Text search by repository name or execution ID returns matching results in real time.
- [ ] Pagination controls allow browsing records in batches of 10, 25, or 50.
- [ ] Clicking an execution row navigates to `/history/[executionId]`, displaying the complete step-by-step audit timeline.

#### 15.6 Settings, UI Responsiveness & Security
- [ ] `/settings/github` displays active connection health and remaining GitHub API rate limits.
- [ ] UI layout adapts seamlessly across mobile (375px), tablet (768px), and desktop (1280px+) screens.
- [ ] No OAuth tokens or private API secrets are exposed in client-side HTML, local storage, or application log files.

---

### 16. Success Metrics & Key Performance Indicators (KPIs)

| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| **Workflow Success Rate** | > 99.0% of non-user-error executions | `(Successful Executions / Total Valid Executions) * 100` |
| **Provisioning Latency** | < 4.0s average total workflow time | Measured from workflow trigger to commit verification completion |
| **Accidental Deletion Incident Rate** | Exactly 0 incidents | Monitored via safety check logs and manual audit reviews |
| **Audit Completeness** | 100% of operations logged | Ratio of database execution records to remote GitHub API operations |
| **Dashboard Responsiveness** | < 1.0s FCP / < 50ms query time | Client performance metrics and database query log monitoring |

---

### 17. Assumptions & Technical Dependencies

1. **GitHub API Availability:** Relies on the standard availability of GitHub REST API v3 and OAuth 2.0 endpoints (`api.github.com`, `github.com/login/oauth`).
2. **OAuth App Registration:** Requires a registered GitHub OAuth Application with configured Client ID, Client Secret, and Callback URL matching the deployment environment.
3. **Environment Configuration:** System depends on server environment variables:
   - `GITHUB_CLIENT_ID` (OAuth App ID)
   - `GITHUB_CLIENT_SECRET` (OAuth App Secret)
   - `AUTHORIZED_GITHUB_USER` (Allowlisted GitHub username)
   - `SESSION_SECRET` (Cryptographic key for cookie encryption)
   - `DATABASE_URL` (Relational database connection string, e.g., PostgreSQL/SQLite)
4. **Time Sync:** Server clock synchronized via NTP for accurate UTC audit timestamping.
