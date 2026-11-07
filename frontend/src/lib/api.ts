import {
  ApiResponse,
  AppSettingsResponse,
  CreateWorkflowRequest,
  DashboardSummary,
  DeletionPreflightResponse,
  HistoryDetailResponse,
  HistoryItemResponse,
  ManagedRepositoryResponse,
  PaginatedResponse,
  UpdateSettingsRequest,
  UserProfile,
  WorkflowRunResponse,
} from "@/types";

class ApiError extends Error {
  code: string;
  details?: Record<string, any>;
  statusCode: number;

  constructor(message: string, code: string = "API_ERROR", statusCode: number = 500, details?: Record<string, any>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export { ApiError };

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Include session cookie in requests
  };

  const response = await fetch(url, config);

  let data: any;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (data && data.error) {
      throw new ApiError(data.error.message || "An error occurred", data.error.code, response.status, data.error.details);
    }
    throw new ApiError(typeof data === "string" ? data : response.statusText, "HTTP_ERROR", response.status);
  }

  return (data as ApiResponse<T>).data;
}

export const api = {
  // Auth
  async getMe(): Promise<UserProfile> {
    return request<UserProfile>("/auth/me");
  },
  async loginWithGithubToken(token: string): Promise<UserProfile> {
    return request<UserProfile>("/auth/github-token", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
  async getLoginUrl(): Promise<{ authorization_url: string; state: string }> {
    return request<{ authorization_url: string; state: string }>("/auth/github/login?format=json");
  },
  async logout(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>("/auth/logout", { method: "POST" });
  },

  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    return request<DashboardSummary>("/dashboard/summary");
  },

  // Automations
  async createAutomation(payload: CreateWorkflowRequest): Promise<WorkflowRunResponse> {
    return request<WorkflowRunResponse>("/automations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async getAutomation(executionId: string): Promise<WorkflowRunResponse> {
    return request<WorkflowRunResponse>(`/automations/${executionId}`);
  },
  async cancelAutomation(executionId: string): Promise<WorkflowRunResponse> {
    return request<WorkflowRunResponse>(`/automations/${executionId}/cancel`, {
      method: "POST",
    });
  },

  // Repositories
  async listRepositories(): Promise<ManagedRepositoryResponse[]> {
    return request<ManagedRepositoryResponse[]>("/repositories");
  },
  async getRepository(repoId: string): Promise<ManagedRepositoryResponse> {
    return request<ManagedRepositoryResponse>(`/repositories/${repoId}`);
  },
  async preflightRepositoryDeletion(repoId: string): Promise<DeletionPreflightResponse> {
    return request<DeletionPreflightResponse>(`/repositories/${repoId}/preflight`);
  },
  async deleteRepository(repoId: string, confirmationText: string): Promise<WorkflowRunResponse> {
    return request<WorkflowRunResponse>(`/repositories/${repoId}/delete`, {
      method: "POST",
      body: JSON.stringify({ confirmation_text: confirmationText }),
    });
  },

  // History
  async listHistory(params: {
    search?: string;
    status?: string;
    operation_type?: string;
    sort_by?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<HistoryItemResponse>> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.status && params.status !== "ALL") searchParams.set("status", params.status);
    if (params.operation_type && params.operation_type !== "ALL") searchParams.set("operation_type", params.operation_type);
    if (params.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params.from_date) searchParams.set("from_date", params.from_date);
    if (params.to_date) searchParams.set("to_date", params.to_date);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.page_size) searchParams.set("page_size", params.page_size.toString());

    const qs = searchParams.toString();
    return request<PaginatedResponse<HistoryItemResponse>>(`/history${qs ? `?${qs}` : ""}`);
  },
  async getHistoryDetail(executionId: string): Promise<HistoryDetailResponse> {
    return request<HistoryDetailResponse>(`/history/${executionId}`);
  },
  async exportHistory(): Promise<HistoryDetailResponse[]> {
    return request<HistoryDetailResponse[]>("/history/export");
  },

  // Settings
  async getSettings(): Promise<AppSettingsResponse> {
    return request<AppSettingsResponse>("/settings");
  },
  async updateSettings(payload: UpdateSettingsRequest): Promise<AppSettingsResponse> {
    return request<AppSettingsResponse>("/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
