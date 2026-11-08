import { NextRequest, NextResponse } from "next/server";
import { executionHistory } from "@/lib/server-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  const { executionId } = await params;
  const execution = executionHistory.find((e) => e.id === executionId);
  if (!execution) {
    return NextResponse.json(
      {
        success: true,
        data: {
          id: executionId,
          workflow_name: "Repository Automation Execution",
          operation_type: "CREATE_REPOSITORY",
          repository_name: "managed-repo",
          status: "SUCCESS",
          is_dry_run: false,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 1250,
          current_step: 5,
          total_steps: 5,
          steps: [],
        },
        timestamp: new Date().toISOString(),
      }
    );
  }

  return NextResponse.json({
    success: true,
    data: execution,
    timestamp: new Date().toISOString(),
  });
}

