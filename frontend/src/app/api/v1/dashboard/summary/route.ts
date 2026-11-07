import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server-auth";
import { executionHistory } from "@/lib/server-store";

export async function GET(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL;
  if (backendUrl && backendUrl !== "http://localhost:8000") {
    try {
      const beRes = await fetch(`${backendUrl}/api/v1/dashboard/summary`, {
        headers: { cookie: request.headers.get("cookie") || "" },
      });
      if (beRes.ok) return NextResponse.json(await beRes.json());
    } catch {
      // Fallback
    }
  }

  const session = getSessionFromRequest(request);
  let repoCount = 0;
  if (session?.token) {
    try {
      const ghRes = await fetch("https://api.github.com/user/repos?per_page=100&type=owner", {
        headers: {
          Authorization: `Bearer ${session.token}`,
          "User-Agent": "GitAuto-Engine/1.0",
        },
      });
      if (ghRes.ok) {
        const repos = await ghRes.json();
        repoCount = Array.isArray(repos) ? repos.length : 0;
      }
    } catch {
      // Ignore
    }
  }

  const total = executionHistory.length;
  const successful = executionHistory.filter((e) => e.status === "SUCCESS" || e.status === "RUNNING_FOREVER").length;
  const failed = executionHistory.filter((e) => e.status === "FAILED").length;
  const partial = executionHistory.filter((e) => e.status === "PARTIAL_FAILURE").length;

  const summary = {
    metrics: {
      total_executions: total,
      successful_executions: successful,
      failed_executions: failed,
      partial_failures: partial,
      success_rate_percentage: total > 0 ? Math.round((successful / total) * 100) : 100,
      active_managed_repositories: repoCount,
      deleted_repositories: executionHistory.filter((e) => e.steps?.some((s: any) => s.payload_snapshot?.auto_deleted)).length,
    },
    recent_activity: executionHistory.slice(0, 10).map((e) => ({
      id: e.id,
      workflow_name: e.workflow_name,
      operation_type: e.operation_type,
      repository_name: e.repository_name,
      status: e.status,
      is_dry_run: e.is_dry_run,
      started_at: e.started_at,
      duration_ms: e.duration_ms,
    })),
  };

  return NextResponse.json({
    success: true,
    data: summary,
    timestamp: new Date().toISOString(),
  });
}

