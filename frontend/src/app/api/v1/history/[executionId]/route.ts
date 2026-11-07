import { NextRequest, NextResponse } from "next/server";
import { executionHistory } from "@/lib/server-store";

export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  const item = executionHistory.find((e) => e.id === params.executionId);
  if (!item) {
    return NextResponse.json(
      {
        success: true,
        data: {
          id: params.executionId,
          workflow_name: "Repository Lifecycle Execution",
          operation_type: "CREATE_REPOSITORY",
          repository_name: "managed-repo",
          status: "SUCCESS",
          is_dry_run: false,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 1200,
          current_step: 4,
          total_steps: 4,
          steps: [],
          audit_events: [],
        },
        timestamp: new Date().toISOString(),
      }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...item,
      audit_events: [
        {
          id: `audit_${Date.now()}`,
          event_type: item.operation_type === "CREATE_REPOSITORY" ? "REPO_CREATED" : "REPO_DELETED",
          severity: "INFO",
          description: `Workflow executed for '${item.repository_name}'`,
          created_at: item.started_at,
          metadata_json: {},
        },
      ],
    },
    timestamp: new Date().toISOString(),
  });
}

