import { NextRequest, NextResponse } from "next/server";
import { executionHistory } from "@/lib/server-store";

export async function GET(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL;
  if (backendUrl && backendUrl !== "http://localhost:8000") {
    try {
      const beRes = await fetch(`${backendUrl}/api/v1/history?${request.nextUrl.searchParams.toString()}`, {
        headers: { cookie: request.headers.get("cookie") || "" },
      });
      if (beRes.ok) return NextResponse.json(await beRes.json());
    } catch {
      // Fallback
    }
  }

  const items = executionHistory.map((e) => ({
    id: e.id,
    workflow_name: e.workflow_name,
    operation_type: e.operation_type,
    repository_name: e.repository_name,
    target_repository_id: e.target_repository_id,
    status: e.status,
    is_dry_run: e.is_dry_run,
    started_at: e.started_at,
    completed_at: e.completed_at,
    duration_ms: e.duration_ms,
    current_step: e.current_step,
    total_steps: e.total_steps,
    total_audit_events: 1,
  }));

  return NextResponse.json({
    success: true,
    data: {
      items,
      pagination: {
        page: 1,
        page_size: 50,
        total_items: items.length,
        total_pages: Math.max(1, Math.ceil(items.length / 50)),
        has_next: false,
        has_prev: false,
      },
    },
    timestamp: new Date().toISOString(),
  });
}

