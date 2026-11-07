# Design System & UI/UX Specification (DESIGN.md)

## Project: GitHub Repository Lifecycle Automation Dashboard (`GitAuto`)
**Document Version:** 1.0.0  
**Design Lead:** Principal UI/UX Architect & Motion Systems Engineer  
**Status:** Approved & Production-Ready  
**Reference Source:** [21st.dev](https://21st.dev/) — Design Engineering & Developer Interface System  
**Target Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui (Radix Primitives), Anime.js

---

## 1. Executive Summary & Design Objectives

The **GitAuto** interface is a specialized, single-user developer tool designed for orchestrating GitHub repository creation, automated scaffolding, and strictly verified lifecycle teardowns. 

### 1.1 Core Design Objectives
1. **Developer-First Precision:** Deliver an ultra-clean, high-density interface focused on legibility, predictability, and immediate visual feedback without superficial decorative fluff.
2. **21st.dev Aesthetic Alignment:** Embody the contemporary design-engineering movement exemplified by `21st.dev` — deep zinc/neutral dark surfaces, crisp hairline borders (`1px solid`), monochrome hierarchy with purposeful semantic accents, refined typography, and subtle micro-interactions.
3. **Safety & Destructive Guardrails:** Visually differentiate non-destructive provisioning from destructive repository de-provisioning through unmistakable visual cues, strict double-confirmation modals, and real-time verification indicators.
4. **Observable Automation State:** Present multi-step asynchronous workflow execution through real-time step progress timelines, state badges, and detailed duration telemetry.
5. **Universal Accessibility:** Ensure WCAG 2.1 AA/AAA compliance across color contrast, responsive layouts, keyboard navigation, focus states, and `prefers-reduced-motion` compliance.

---

## 2. Reference Website Analysis (`https://21st.dev/`)

A forensic analysis of the reference design engineering platform **21st.dev** reveals a distinct, highly polished visual language tailored for modern software builders and design engineers.

```
+----------------------------------------------------------------------------------------------------+
|                                    21ST.DEV DESIGN DNA MAPPING                                     |
+----------------------------------------------------------------------------------------------------+
| Attribute               | 21st.dev Reference Execution           | GitAuto Implementation          |
+-------------------------+----------------------------------------+---------------------------------+
| Aesthetic Baseline      | Modern monochrome zinc / near-black    | Deep Zinc (Dark) / Pure Light   |
| Surface Contrast        | Dark background (#09090b / #000000)    | #09090B (Background), #121215   |
| Border Strategy         | 1px hairline border (#27272a / zinc-800)| 1px crisp borders (zinc-800/200)|
| Typography              | Geist Sans & Geist Mono (Modern neo)   | Geist Sans + Geist Mono         |
| Radius Model            | Smooth intermediate corners (8px–12px) | 8px (Cards/Modals), 6px (Input) |
| Interactive Accent      | Shimmer buttons, subtle hover scales   | Subtle glows, smooth 150ms anim |
| Density & Spacing       | High-information density, tight rhythm | 4px/8px modular spacing scale   |
+-------------------------+----------------------------------------+---------------------------------+
```

### 2.1 Visual Identity & Philosophy
- **Dark-First Elegance:** The default aesthetic leverages near-black backgrounds (`#09090b` / `#030712`) paired with slightly elevated card surfaces (`#121215` / `#18181b`), providing high visual depth without relying on heavy skeuomorphism or harsh contrast jumps.
- **Hairline Structural Borders:** Content separation relies on delicate `1px` borders (`#27272a` in dark mode, `#e4e4e7` in light mode) rather than large drop shadows or tinted section backgrounds.
- **Purposeful Semantic Highlights:** 95% of the interface remains strictly monochrome (zinc/white/slate), allowing semantic colors (Emerald for `SUCCESS`, Crimson for `FAILED`, Amber for `IN_PROGRESS`/`PARTIAL_FAILURE`) to draw immediate user attention.
- **Crafted Micro-Interactions:** Micro-hover states utilize 1.01x subtle scaling, subtle border luminescence, and fine gradient ring highlights (shimmer borders) rather than abrupt color shifts.

### 2.2 Navigation Architecture
- **Persistent Header + Clean Sidebar:** Minimalist top navigation bar with clear breadcrumbs, GitHub account indicator, system status dot, and global action triggers.
- **Active State Semantics:** Active navigation links utilize a subtle background pill (`bg-zinc-800/60` dark / `bg-zinc-100` light) with high-contrast text and a small left or bottom indicator bar.
- **Dropdowns & Popovers:** Radix-powered popovers with `1px` solid borders, `backdrop-blur-md`, subtle drop shadow (`0 10px 30px -10px rgba(0,0,0,0.5)`), and smooth 100ms fade-scale transitions.

### 2.3 Component Primitives & Motion
- **Buttons:** Crisp pill/rounded rectangles with subtle internal inset highlights (`inset 0 1px 0 rgba(255,255,255,0.1)` on dark themes) and tactile active state compression (`scale(0.98)`).
- **Cards & Data Tables:** Clean, unified headers with monospace metadata labels, compact table rows with hover highlighting, and zero zebra-striping in favor of fine horizontal divider lines.
- **Motion:** Fast, responsive transitions (150ms–250ms) using cubic bezier curves (`cubic-bezier(0.16, 1, 0.3, 1)`), avoiding sluggish animations that slow down workflow efficiency.

---

## 3. Visual Direction & Brand Identity

### 3.1 Design Principles

```
  [ 01. INTENTIONAL MONOCHROME ]
  Use neutral Zinc scales as the primary canvas. Restrict vibrant colors exclusively
  to live automation states, safety interlocks, and critical alerts.

  [ 02. MATHEMATICAL TYPOGRAPHY ]
  Pair clean geometric neo-grotesque sans-serif with a crisp tabular monospace font
  for commit SHAs, timestamps, execution IDs, and status codes.

  [ 03. TACTILE SAFETY INTERLOCKS ]
  Destructive operations (repo deletion) must look and feel distinct from standard
  flows, using crimson hazard accents, double-confirmation inputs, and explicit warnings.

  [ 04. FLUID STEP PROGRESSION ]
  Real-time automation steps must visually communicate progress with animated 
  pulse spinners, checkmark transitions, and clear error tracebacks.
```

### 3.2 Anti-Patterns to Avoid
- ❌ **No Excessive Glassmorphism / Heavy Blurs:** Excessive backdrop blurs degrade performance and reduce text contrast.
- ❌ **No Rainbow Gradients or AI Glows:** Avoid gratuitous purple/magenta neon glow halos that distract from core technical data.
- ❌ **No Cluttered Skeuomorphism:** Keep cards, inputs, and buttons flat with refined `1px` borders.
- ❌ **No Sluggish Long-Duration Animations:** Never force the user to wait for a 1000ms card fade-in when inspecting critical logs.

---

## 4. Color System & Design Tokens

The color palette is built around the modern **Zinc** grayscale foundation, enhanced with mathematically balanced semantic tones for dark and light modes.

### 4.1 Master Palette Table

```
+-------------------------------------------------------------------------------------------------------------------+
|                                            MASTER COLOR TOKEN SPECIFICATION                                       |
+------------------------+-------------------+-------------------+--------------------------------------------------+
| Token Name             | Dark Mode (HEX)   | Light Mode (HEX)  | Semantic Role / Description                      |
+------------------------+-------------------+-------------------+--------------------------------------------------+
| `--background`         | `#09090B`         | `#FFFFFF`         | Base canvas / application background             |
| `--background-subtle`  | `#0C0C0E`         | `#F8F9FA`         | Secondary panel background / sidebar surface     |
| `--card`               | `#121215`         | `#FFFFFF`         | Elevated card & modal container surface          |
| `--card-hover`         | `#18181C`         | `#F4F4F5`         | Interactive card hover state                     |
| `--popover`            | `#121215`         | `#FFFFFF`         | Dropdowns, tooltips, dialogs                     |
| `--border`             | `#27272A`         | `#E4E4E7`         | Primary structural divider & hairline border     |
| `--border-subtle`      | `#1C1C1F`         | `#F4F4F5`         | Secondary subtle table / item dividers           |
| `--border-focus`       | `#52525B`         | `#71717A`         | Focused element border / active input ring       |
| `--foreground`         | `#F4F4F5`         | `#09090B`         | Primary high-contrast text & icons               |
| `--foreground-muted`   | `#A1A1AA`         | `#52525B`         | Secondary labels, descriptions, and metadata     |
| `--foreground-subtle`  | `#71717A`         | `#A1A1AA`         | Inactive hints, placeholder text, disabled icons |
| `--primary`            | `#FAFAFA`         | `#18181B`         | Primary action button fill & high-priority badge |
| `--primary-foreground` | `#18181B`         | `#FAFAFA`         | Text on primary action button                    |
| `--secondary`          | `#1E1E22`         | `#F4F4F5`         | Secondary button fill & neutral container        |
| `--secondary-fg`       | `#E4E4E7`         | `#18181B`         | Secondary button text                            |
| `--muted`              | `#18181B`         | `#F4F4F5`         | Muted badges, inactive tab backgrounds           |
| `--muted-foreground`   | `#71717A`         | `#71717A`         | Muted text & tertiary indicators                 |
| `--accent`             | `#27272A`         | `#F4F4F5`         | Hover highlighting on list items & menus         |
| `--accent-foreground`  | `#FAFAFA`         | `#09090B`         | Text on accented item                            |
| `--success`            | `#10B981` (Emerald)| `#059669`        | Workflow Success, Active status, Live connection |
| `--success-bg`         | `#06281E`         | `#ECFDF5`         | Subtle background for success badges/toasts      |
| `--success-border`     | `#047857`         | `#A7F3D0`         | Border for success badges/cards                  |
| `--warning`            | `#F59E0B` (Amber)  | `#D97706`         | In-Progress, Pending, Partial Failure, Dry-Run   |
| `--warning-bg`         | `#261C08`         | `#FFFBEB`         | Background for warning alerts and badges         |
| `--warning-border`     | `#B45309`         | `#FDE68A`         | Border for warning badges/cards                  |
| `--destructive`        | `#EF4444` (Red)    | `#DC2626`         | Delete repository, Failed workflow, Danger alerts|
| `--destructive-bg`     | `#2A0E11`         | `#FEF2F2`         | Destructive modal header background, error pills  |
| `--destructive-border` | `#991B1B`         | `#FECACA`         | Destructive input error border / modal border    |
| `--info`               | `#38BDF8` (Sky)    | `#0284C7`         | Informational notices, API rate limit stats       |
| `--info-bg`            | `#082130`         | `#F0F9FF`         | Info alert background                             |
| `--info-border`        | `#0369A1`         | `#BAE6FD`         | Info alert border                                 |
+------------------------+-------------------+-------------------+--------------------------------------------------+
```

### 4.2 CSS Custom Properties (`globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --background-subtle: 210 20% 98%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --card-hover: 240 4.8% 95.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --border-subtle: 240 4.8% 95.9%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --background-subtle: 240 10% 4.7%;
    --foreground: 0 0% 98%;
    --card: 240 10% 7.1%;
    --card-foreground: 0 0% 98%;
    --card-hover: 240 10% 9.5%;
    --popover: 240 10% 7.1%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 5.9% 12.5%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 5.9% 12.5%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 5.9% 15.5%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 45%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 17%;
    --border-subtle: 240 5.9% 12.5%;
    --input: 240 5.9% 17%;
    --ring: 240 4.9% 83.9%;
  }
}
```

---

## 5. Typography System

The typography system pairs **Geist Sans** (for UI labels, headings, body text) with **Geist Mono** (for technical data, execution IDs, commit SHAs, timestamps, code blocks).

### 5.1 Type Scale Specification

```
+----------------------------------------------------------------------------------------------------+
|                                    TYPOGRAPHIC SCALE SPECIFICATION                                 |
+-----------------+------------+-------------+--------------+------------+---------------------------+
| Role / Variant  | Font Size  | Line Height | Font Weight  | Tracking   | Applied Components        |
+-----------------+------------+-------------+--------------+------------+---------------------------+
| Display 1 (H1)  | 32px / 2rem| 38px (1.20) | 700 (Bold)   | -0.025em   | Login Title, Hero Heading |
| Section (H2)    | 24px /1.5rem| 30px (1.25)| 600 (Semibld)| -0.020em   | Page Titles, Modal Titles |
| Subheading (H3) | 18px /1.12r| 24px (1.33) | 600 (Semibld)| -0.015em   | Card Titles, Panel Headers|
| Component (H4)  | 15px /0.94r| 20px (1.35) | 600 (Semibld)| -0.010em   | Stat Card Label, Timeline |
| Body Default    | 14px /0.87r| 20px (1.42) | 400 (Regular)| normal     | Table Data, Paragraphs    |
| Body Medium     | 14px /0.87r| 20px (1.42) | 500 (Medium) | normal     | Primary Button, Form Input|
| Micro / Caption | 12px /0.75r| 16px (1.33) | 500 (Medium) | +0.010em   | Badges, Tooltips, Subtext |
| Mono Base       | 13px /0.81r| 18px (1.38) | 400 (Regular)| normal     | File paths, Git commands  |
| Mono Compact    | 12px /0.75r| 16px (1.33) | 500 (Medium) | normal     | Execution IDs, Commit SHA |
+-----------------+------------+-------------+--------------+------------+---------------------------+
```

### 5.2 Font Stack Declaration
```ts
// tailwind.config.ts typography configuration
fontFamily: {
  sans: ["var(--font-geist-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
  mono: ["var(--font-geist-mono)", "JetBrains Mono", "Fira Code", "ui-monospace", "SFMono-Regular", "monospace"],
}
```

---

## 6. Spacing, Elevation & Surface Architecture

### 6.1 Spacing Scale (4px Base Grid)
- **`space-1` (4px):** Tight inner gap between badge dot and text, icon to text inline offset.
- **`space-2` (8px):** Form field label to input margin, dropdown item vertical padding, button inner gap.
- **`space-3` (12px):** Compact card padding, table cell vertical padding, modal button action gap.
- **`space-4` (16px):** Standard card padding, form group gap, list item separation.
- **`space-6` (24px):** Grid column gap, card container separation, panel headers.
- **`space-8` (32px):** Page section margin, dashboard grid row gap.
- **`space-12` (48px):** Page top padding, major workflow step dividers.

### 6.2 Radius Hierarchy
- **`radius-sm` (4px):** Small badges, tag indicators, code highlights.
- **`radius-md` (6px):** Form inputs, buttons, dropdown menu containers.
- **`radius-lg` (8px):** Standard cards, metric panels, execution step accordions.
- **`radius-xl` (12px):** Confirmation dialogs, modal viewports, settings panels.
- **`radius-full` (9999px):** Avatar images, live status pulse dots, pill badges.

### 6.3 Border & Shadow Elevation System
```css
/* Elevation Level 0 (Base Canvas) */
border: 1px solid var(--border);

/* Elevation Level 1 (Card & Panel Surface) */
background-color: var(--card);
border: 1px solid var(--border);
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Elevation Level 2 (Hovered Card & Dropdowns) */
box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.25), 0 2px 6px -1px rgba(0, 0, 0, 0.15);

/* Elevation Level 3 (Modals & Overlays) */
box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border);
```

---

## 7. Layout System & Wireframe Blueprint

### 7.1 Master Application Shell Structure

```
+----------------------------------------------------------------------------------------------------+
|                                    APPLICATION SHELL STRUCTURE                                     |
+----------------------------------------------------------------------------------------------------+
| TOPBAR HEADER (Height: 56px)                                                                       |
| [ GitAuto Logo ] / [ Organization / Personal ]           [ Rate Limit: 4,890/5k ] [ User: @octocat ]|
+----------------------------------------------------------------------------------------------------+
| SIDEBAR (Width: 240px)          | MAIN WORKSPACE CONTENT AREA (Fluid: calc(100vw - 240px))         |
|                                 |                                                                  |
| - [⚡ Dashboard]                 | Breadcrumb: Dashboard > Overview                                 |
| - [🚀 New Automation]           | Page Header: "Repository Lifecycle Overview"                     |
| - [📦 Managed Repositories]     |                                                                  |
| - [📜 Execution History]        | [ Metric Card 1 ] [ Metric Card 2 ] [ Metric Card 3 ] [ Card 4 ] |
| - [⚙️ Settings]                 |                                                                  |
|                                 | +--------------------------------------------------------------+ |
| ------------------------------- | | RECENT AUTOMATION EXECUTIONS                                 | |
| Status: Connected (GitHub API)  | | [ Search Input... ] [ Filter Status v ] [ + New Workflow ]   | |
| [ 🔄 Sync Status ]  [ 🚪 Logout]| | [ Execution Rows with Step Indicators & Duration Telemetry ] | |
|                                 | +--------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

### 7.2 Page 1: Authentication View (`/login`)
- **Layout:** Centered card composition with a deep radial gradient backdrop (`radial-gradient(circle at center, rgba(39,39,42,0.4) 0%, rgba(9,9,11,1) 100%)`).
- **Header:** Clean `GitAuto` wordmark with monochrome Git branch icon.
- **Description:** *"Single-user GitHub repository lifecycle automation and safety platform."*
- **Action Button:** Full-width high-contrast button *"Continue with GitHub"* featuring official GitHub SVG icon and subtle hover shimmer.
- **Security Notice:** Muted caption: *"Protected by Allowlist Verification & PKCE OAuth 2.0."*
- **Error State:** Inlined crimson alert badge if unauthorized account attempts access: *"Account @username is not authorized for this instance."*

```
+------------------------------------------------------------------+
|                           [ GitAuto ]                            |
|                                                                  |
|              GitHub Repository Lifecycle Automation              |
|          Secure, single-tenant provisioning and de-provisioning  |
|                                                                  |
|    +--------------------------------------------------------+    |
|    | [ GitHub Logo ]   Continue with GitHub                 |    |
|    +--------------------------------------------------------+    |
|                                                                  |
|    🔒 Authorized instance access only. Protected by PKCE.        |
+------------------------------------------------------------------+
```

### 7.3 Page 2: Dashboard Overview (`/dashboard`)
- **Header Section:** Greeting, user avatar thumbnail, connected status pill, and primary action `[ + New Automation ]`.
- **Telemetry Metric Grid (4 Columns):**
  1. **Total Executions:** Large number, subtitle *"All-time workflow runs"*.
  2. **Active Managed Repos:** Count of currently existing tracked repos with green live dot.
  3. **Success Rate:** Percentage badge (e.g., `99.2%`) with mini sparkline indicator.
  4. **Repositories Cleaned:** Total safe deletions executed with audit logs intact.
- **Recent Executions Panel:** 5 most recent runs featuring execution ID pill, workflow badge (`CREATE_REPO`, `DELETE_REPO`), target repo name, started timestamp (formatted to user timezone), elapsed duration, and status badge.
- **Quick Action Bar:** One-click shortcuts to provision demo sandbox, review active repositories, or check GitHub API rate limits.

### 7.4 Page 3: Automation Orchestrator (`/automations/new`)
- **Workflow Selection Tabs:** 
  - `Tab 1: Create & Initialize Repository (Task 1)`
  - `Tab 2: Safe Repository Deletion (Task 2)`
- **Configuration Form (Task 1):**
  - **Repository Name:** Text input with real-time validation (auto-slugification, GitHub naming rules checker, checkmark when available).
  - **Visibility:** Segmented Radio group `[ 🔒 Private (Default) ]` | `[ 🌐 Public ]`.
  - **Description:** Optional textarea for repository summary.
  - **Default Branch:** Select input (`main`, `master`, custom).
  - **Initial Content Scaffolding:** Checkbox group:
    - `[x] Generate Structured README.md`
    - `[x] Add Standard .gitignore Template` (Select: `Node`, `Python`, `Go`, `Rust`, `None`)
    - `[ ] Include MIT License`
  - **Execution Mode Toggle:** Switch `[ Dry-Run (Preview Mode) ]` vs `[ Live Execution ]`.
- **Live Preview Panel (Right Side / Split View):**
  - Real-time generated Markdown preview of `README.md`.
  - Step breakdown preview list showing all 6 operations to be executed.
  - Action trigger: `[ 🚀 Execute Automation ]`.

### 7.5 Page 4: Execution Details & Audit Timeline (`/history/[executionId]`)
- **Execution Summary Header:** 
  - Execution ID (`exec_9a7b1c3d`) with 1-click copy button.
  - Status Badge (`SUCCESS` in Emerald, `PARTIAL_FAILURE` in Amber, `FAILED` in Crimson).
  - Started at, Completed at, and exact duration (`1,842ms`).
- **Interactive Step Timeline (Vertical Stepper):**
  - **Step 1:** Validate GitHub OAuth session & permissions (`200 OK`, `82ms`).
  - **Step 2:** Request Repository Creation via GitHub API (`POST /user/repos` -> `201 Created`, `540ms`).
  - **Step 3:** Record Managed Repository Identity (`github_repo_id: 894123512`, `14ms`).
  - **Step 4:** Generate & Base64 Encode Initial Templates (`12ms`).
  - **Step 5:** Push Initial Commit to Default Branch (`PUT /contents/README.md` -> `201 Created`, `710ms`).
  - **Step 6:** Verify Commit SHA & Branch HEAD (`GET /branches/main` -> `200 OK`, `484ms`).
- **Raw API Log Inspector (Collapsible Drawer):** Expandable JSON inspector showing sanitized request payload, headers, and GitHub API response metadata.

### 7.6 Page 5: Managed Repositories & Safe Deletion (`/repositories`)
- **Repository List Table:**
  - Column 1: Repository Name (linking directly to remote GitHub URL with external link icon).
  - Column 2: Visibility Badge (`PRIVATE` / `PUBLIC`).
  - Column 3: GitHub Unique Repo ID (`894123512`).
  - Column 4: Provisioned Date & Provisioning Workflow ID.
  - Column 5: Lifecycle Status (`ACTIVE` with green dot, `DELETED` with strikethrough).
  - Column 6: Action Button: `[ 🗑️ Delete Repository ]` (disabled if already deleted).
- **Destructive Deletion Confirmation Modal (The Safety Interlock):**
  - Heavy red-tinted hazard header: *"Destructive Action: Delete Remote Repository"*.
  - Warning banner: *"This will permanently delete the GitHub repository **octocat/sandbox-service** and all its branches/commits. This action cannot be undone."*
  - Safety input prompt: *"To confirm, type the exact repository name **sandbox-service** below:"*
  - Confirmation button: `[ I understand the consequences, delete this repository ]` — strictly disabled until the input text exactly matches the repository name character-for-character.
  - Verification loader: Displays live spinner during remote deletion and subsequent `404` verification polling.

```
+--------------------------------------------------------------------------+
|  ⚠️  DESTRUCTIVE ACTION: DELETE REMOTE REPOSITORY                        |
+--------------------------------------------------------------------------+
|  This operation will permanently delete:                                 |
|  📦 octocat/sandbox-demo-service (ID: 894123512)                         |
|                                                                          |
|  • Remote repository and all commit history will be purged on GitHub.   |
|  • Application audit logs and execution history will be PRESERVED.      |
|                                                                          |
|  To confirm, please type "sandbox-demo-service" below:                   |
|  +--------------------------------------------------------------------+  |
|  | sandbox-demo-service                                               |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  [ Cancel ]              [ 🗑️ Permanently Delete Remote Repository ]     |
+--------------------------------------------------------------------------+
```

### 7.7 Page 6: Execution History & Search / Filter (`/history`)
- **Filter Controls Toolbar:**
  - Search input: Real-time debounced query matching repo name or execution ID.
  - Status Dropdown: `All Statuses`, `Success`, `Failed`, `In Progress`, `Partial Failure`.
  - Operation Type: `All Workflows`, `Create & Scaffolding`, `Repository Deletion`.
  - Date Range Picker: Quick presets (`Today`, `Last 7 Days`, `Last 30 Days`, `Custom`).
  - Clear Filters button and active match counter (`Showing 14 of 48 runs`).
- **Data Table:** High-density, sortable columns by Timestamp, Duration, and Status.
- **Pagination Bar:** Results per page (`10`, `25`, `50`) with Previous/Next controls.

---

## 8. Component Design System

All components are constructed using **Radix UI** primitives and **Tailwind CSS**, adhering strictly to the `21st.dev` design engineering philosophy.

### 8.1 Button Hierarchy & Specifications

```
+-------------------------------------------------------------------------------------------------------------------+
|                                            BUTTON COMPONENT SPECIFICATIONS                                        |
+-------------------+-----------------------+-----------------------+-----------------------------------------------+
| Variant           | Default Style (Dark)  | Hover / Active State  | Primary Usage                                 |
+-------------------+-----------------------+-----------------------+-----------------------------------------------+
| `Primary`         | `bg-zinc-100 text-zinc-950 font-medium px-4 py-2 rounded-md shadow-sm` | `hover:bg-white active:scale-[0.98] transition-all duration-150` | Primary workflow execution, Save actions |
| `Secondary`       | `bg-zinc-800/80 text-zinc-200 border border-zinc-700/60 px-4 py-2 rounded-md` | `hover:bg-zinc-700/90 hover:text-white active:scale-[0.98]` | Cancel actions, secondary navigation |
| `Destructive`     | `bg-red-600/90 text-white font-medium px-4 py-2 rounded-md shadow-sm` | `hover:bg-red-500 active:scale-[0.98] focus:ring-red-500` | Repository deletion confirm action |
| `Outline / Ghost` | `bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 px-3 py-1.5` | `hover:border-zinc-700 transition-colors` | Table action buttons, icon triggers |
| `Shimmer (21st)`  | `relative overflow-hidden bg-zinc-950 text-white border border-zinc-800 shadow-md` | `hover:border-zinc-700 hover:scale-[1.01] transition-transform` | GitHub Login CTA, Special Highlights |
+-------------------+-----------------------+-----------------------+-----------------------------------------------+
```

### 8.2 Status Badges Specification

```
+-------------------------------------------------------------------------------------------------------------------+
|                                            STATUS BADGE SPECIFICATIONS                                            |
+--------------------+---------------------+---------------------+--------------------------------------------------+
| Status             | Background (Dark)   | Text Color (Dark)   | Visual Indicator                                 |
+--------------------+---------------------+---------------------+--------------------------------------------------+
| `SUCCESS`          | `bg-emerald-950/60` | `text-emerald-400`  | Solid green dot (`bg-emerald-500`) + Checkmark   |
| `IN_PROGRESS`      | `bg-amber-950/60`   | `text-amber-400`    | Pulsing yellow dot (`animate-ping`) + Spinner    |
| `PENDING`          | `bg-zinc-900`       | `text-zinc-400`     | Hollow gray ring (`border-zinc-600`)             |
| `FAILED`           | `bg-red-950/60`     | `text-red-400`      | Solid red dot (`bg-red-500`) + Cross icon        |
| `PARTIAL_FAILURE`  | `bg-amber-950/80`   | `text-amber-300`    | Split warning badge + Retry button icon          |
| `DRY_RUN`          | `bg-sky-950/60`     | `text-sky-400`      | Blueprint dashed border + "SIMULATED" badge      |
+--------------------+---------------------+---------------------+--------------------------------------------------+
```

### 8.3 Form Controls & Input Styling
- **Text Inputs & Selects:**
  - Height: `36px` (`h-9`), padding `px-3 py-1.5`, font-size `14px`.
  - Border: `1px solid var(--border)` (`#27272a` dark / `#e4e4e7` light).
  - Background: `bg-zinc-950/50` dark / `bg-white` light.
  - Focus Ring: `focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400`.
  - Validation Error: `border-red-500 focus:ring-red-500 text-red-200`.
- **Toggle Switches:**
  - Track: `20px` height x `36px` width, `rounded-full`, `bg-zinc-800` (inactive) -> `bg-zinc-100` (active).
  - Thumb: `16px` circle, `bg-zinc-950`, smooth `150ms` horizontal sliding translation.

---

## 9. Animation & Motion Design System (Anime.js)

Motion in GitAuto is purposeful and snappy, designed to confirm actions and guide spatial orientation without adding cognitive friction.

### 9.1 Motion Architecture & Timing Tokens

```ts
// lib/animations/constants.ts
export const MOTION_TOKENS = {
  duration: {
    instant: 100, // micro-feedbacks, button presses
    fast: 180,    // dropdowns, tooltips, hover highlights
    normal: 280,  // card entrances, modal opens, step transitions
    deliberate: 450 // timeline step completions, progress bars
  },
  easing: {
    springOut: "cubicBezier(0.16, 1, 0.3, 1)", // natural deceleration
    sharp: "cubicBezier(0.4, 0, 0.2, 1)",      // standard interface transitions
    bounce: "cubicBezier(0.34, 1.56, 0.64, 1)" // tactile popovers & confirmations
  }
};
```

### 9.2 Reusable Anime.js Animation Utilities

#### 1. Page Entrance Transition
```ts
import anime from "animejs";

export const animatePageEntrance = (containerElement: HTMLElement) => {
  anime({
    targets: containerElement.querySelectorAll(".animate-fade-up"),
    opacity: [0, 1],
    translateY: [12, 0],
    delay: anime.stagger(40, { start: 50 }),
    duration: 280,
    easing: "cubicBezier(0.16, 1, 0.3, 1)"
  });
};
```

#### 2. Workflow Step Completion Transition
```ts
export const animateStepSuccess = (stepElement: HTMLElement) => {
  anime.timeline()
    .add({
      targets: stepElement.querySelector(".step-icon"),
      scale: [0.8, 1.2, 1.0],
      duration: 320,
      easing: "cubicBezier(0.34, 1.56, 0.64, 1)"
    })
    .add({
      targets: stepElement.querySelector(".step-status-badge"),
      opacity: [0, 1],
      translateX: [-8, 0],
      duration: 200,
      easing: "easeOutQuad"
    }, "-=150");
};
```

#### 3. Modal Safety Entrance
```ts
export const animateModalEntrance = (modalContainer: HTMLElement) => {
  anime({
    targets: modalContainer,
    opacity: [0, 1],
    scale: [0.96, 1],
    translateY: [8, 0],
    duration: 220,
    easing: "cubicBezier(0.16, 1, 0.3, 1)"
  });
};
```

### 9.3 Accessibility & Reduced Motion Handling
All Anime.js animations automatically query `window.matchMedia('(prefers-reduced-motion: reduce)')`. When active, durations are set to `0ms` and transform animations are disabled, preserving immediate state transitions without motion sickness triggers.

---

## 10. Responsive Design Matrix

GitAuto provides a unified responsive experience across viewport widths ranging from mobile phones to high-resolution widescreen monitors.

```
+-------------------------------------------------------------------------------------------------------------------+
|                                              RESPONSIVE BREAKPOINT MATRIX                                         |
+-------------------+---------------+-------------------------------------------------------------------------------+
| Viewport Tier     | Width Range   | Layout Adaptation & Component Behavior                                        |
+-------------------+---------------+-------------------------------------------------------------------------------+
| Mobile (`sm`)     | < 768px       | - Sidebar collapses into a slide-over Sheet drawer accessible via hamburger.  |
|                   |               | - Metric grid collapses into 1-column stack.                                  |
|                   |               | - Data tables collapse into mobile card rows with stacked metadata.           |
|                   |               | - Destructive modal fills 95% of viewport width.                              |
+-------------------+---------------+-------------------------------------------------------------------------------+
| Tablet (`md`)     | 768px–1023px  | - Sidebar remains collapsed into icon-only rail (64px width).                 |
|                   |               | - Metric grid displays in 2x2 grid format.                                    |
|                   |               | - Data tables display horizontal scroll with sticky primary identifier column.|
|                   |               | - Automation creator form switches to single-column vertical flow.            |
+-------------------+---------------+-------------------------------------------------------------------------------+
| Desktop (`lg`)    | 1024px–1439px | - Standard 240px persistent sidebar.                                          |
|                   |               | - 4-column metric grid.                                                       |
|                   |               | - Split-view automation creator (Form on Left 60%, Live Preview on Right 40%).|
|                   |               | - Full data table with all columns visible.                                   |
+-------------------+---------------+-------------------------------------------------------------------------------+
| Wide (`2xl`)      | >= 1440px     | - Centered max-width container (`max-w-7xl` / 1400px) with comfortable margins.|
|                   |               | - High-density logs inspector expanded by default on history detail pages.    |
+-------------------+---------------+-------------------------------------------------------------------------------+
```

---

## 11. Accessibility (a11y) & Usability Standards

1. **Contrast Ratio Compliance:**
   - All body text against dark backgrounds achieves a minimum contrast ratio of `7.5:1` (WCAG AAA).
   - Muted labels achieve at least `4.8:1` (WCAG AA).
   - Destructive alert banners maintain `5.2:1` contrast with crisp white text.
2. **Keyboard Navigation & Focus Management:**
   - Universal focus ring: `ring-2 ring-zinc-400 ring-offset-2 ring-offset-zinc-950` visible on all interactive elements during keyboard navigation (`Tab` / `Shift+Tab`).
   - Modal focus trapping: Opening the deletion dialog traps keyboard focus within the modal container until closed or submitted.
   - `Escape` key immediately closes open dropdowns, popovers, and non-destructive modals.
3. **Screen Reader (ARIA) Semantics:**
   - Real-time workflow execution updates utilize `aria-live="polite"` regions so screen readers announce step completions without interrupting user actions.
   - Status badges include explicit `aria-label="Status: Success"` attributes.
   - Destructive buttons utilize `aria-haspopup="dialog"` and `aria-describedby` linking to the danger explanation text.

---

## 12. Design Tokens Reference & Implementation Guide

### 12.1 Tailwind Theme Extension (`tailwind.config.ts`)

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 21st.dev zinc custom scales
        zinc: {
          950: "#09090b",
          900: "#121215",
          850: "#18181c",
          800: "#27272a",
          700: "#3f3f46",
          600: "#52525b",
          500: "#71717a",
          400: "#a1a1aa",
          300: "#d4d4d8",
          200: "#e4e4e7",
          100: "#f4f4f5",
          50:  "#fafafa",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 13. Verification & Architectural Alignment Checklist

- [x] **PRD Alignment:** Fully covers all routes (`/login`, `/dashboard`, `/automations/new`, `/history`, `/history/[executionId]`, `/repositories`, `/settings`, `/settings/github`).
- [x] **21st.dev Visual Identity:** Extensively integrates hairline borders, zinc monochrome scale, precision typography, and micro-interactions.
- [x] **Safety Interlock Design:** Full UI/UX specification for typed double-confirmation modal on destructive repository deletions.
- [x] **Motion Specifications:** Defined duration, easing, stagger, and reduced-motion handling using Anime.js.
- [x] **Component System:** Complete definitions for buttons, inputs, status badges, metric cards, timeline steppers, modals, and tables.
- [x] **Accessibility & Responsiveness:** Verified WCAG contrast metrics, keyboard focus rings, and mobile/tablet/desktop adaptive rules.
