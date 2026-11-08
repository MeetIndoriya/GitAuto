export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
  timestamp: string;
}

export interface GitHubConnectionInfo {
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | "WARNING";
  scopes: string[];
  rate_limit_remaining: number;
  rate_limit_total: number;
  rate_limit_reset_at: string | null;
}

export interface UserProfile {
  id: string;
  github_user_id: number;
  github_username: string;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  connection?: GitHubConnectionInfo;
}

export interface DashboardMetrics {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  partial_failures: number;
  success_rate_percentage: number;
  active_managed_repositories: number;
  deleted_repositories: number;
}

export interface RecentActivityItem {
  id: string;
  workflow_name: string;
  operation_type: "CREATE_REPOSITORY" | "DELETE_REPOSITORY" | "RETRY_SCAFFOLD";
  repository_name: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "PARTIAL_FAILURE" | "CANCELLED" | "RUNNING_FOREVER";
  is_dry_run: boolean;
  started_at: string;
  duration_ms: number | null;
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  recent_activity: RecentActivityItem[];
}

export interface WorkflowStepResponse {
  id: string;
  step_number: number;
  step_name: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "SKIPPED";
  http_method: string | null;
  api_endpoint: string | null;
  http_status_code: number | null;
  duration_ms: number | null;
  error_details: string | null;
  payload_snapshot: Record<string, any> | null;
  started_at: string;
  completed_at: string | null;
}

export interface WorkflowRunResponse {
  id: string;
  workflow_name: string;
  operation_type: "CREATE_REPOSITORY" | "DELETE_REPOSITORY" | "RETRY_SCAFFOLD";
  repository_name: string;
  target_repository_id: string | null;
  status: "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "PARTIAL_FAILURE" | "CANCELLED" | "RUNNING_FOREVER";
  is_dry_run: boolean;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  current_step: number;
  total_steps: number;
  steps: WorkflowStepResponse[];
}

export interface CreateWorkflowRequest {
  repository_name: string;
  description?: string;
  visibility: "public" | "private";
  default_branch: string;
  init_readme: boolean;
  readme_template?: string;
  gitignore_template?: string;
  license_template?: string;
  is_dry_run: boolean;
  auto_delete?: boolean;
  commits_count?: number;
  commits_per_day?: number;
  start_date?: string;
  end_date?: string;
  repo_prefix?: string;
}

export interface ManagedRepositoryResponse {
  id: string;
  github_repository_id: number;
  github_node_id: string | null;
  repository_name: string;
  repository_full_name: string;
  visibility: "public" | "private";
  default_branch: string;
  status: "ACTIVE" | "DELETED" | "PARTIAL_FAILURE" | "DELETED_EXTERNALLY";
  workflow_run_id: string | null;
  remote_created_at: string | null;
  remote_deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeletionPreflightResponse {
  repository_id: string;
  repository_name: string;
  repository_full_name: string;
  github_repository_id: number;
  status: string;
  safety_check_passed: boolean;
  message: string;
}

export interface HistoryItemResponse {
  id: string;
  workflow_name: string;
  operation_type: "CREATE_REPOSITORY" | "DELETE_REPOSITORY" | "RETRY_SCAFFOLD";
  repository_name: string;
  target_repository_id: string | null;
  status: "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "PARTIAL_FAILURE" | "CANCELLED" | "RUNNING_FOREVER";
  is_dry_run: boolean;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  step_count: number;
  successful_step_count: number;
}

export interface HistoryDetailResponse extends WorkflowRunResponse {}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface RepositoryDefaults {
  default_visibility: "public" | "private";
  default_branch: string;
  default_gitignore: string;
  default_init_readme: boolean;
  naming_prefix: string;
}

export interface AutomationPreferences {
  enable_dry_run_by_default: boolean;
  auto_verify_commits: boolean;
  request_timeout_seconds: number;
  theme_preference: "system" | "dark" | "light";
}

export interface AppSettingsResponse {
  repository_defaults: RepositoryDefaults;
  automation_preferences: AutomationPreferences;
  authorized_user: string;
  environment: string;
}

export interface UpdateSettingsRequest {
  repository_defaults?: Partial<RepositoryDefaults>;
  automation_preferences?: Partial<AutomationPreferences>;
}
