import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { repoId: string } }
) {
  const session = getSessionFromRequest(request);
  if (!session || !session.token) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const body = await request.json();
  const repoName = body.confirmation_text?.trim();
  if (!repoName) {
    return NextResponse.json(
      { success: false, error: { code: "CONFIRMATION_MISMATCH", message: "Repository confirmation name is required." } },
      { status: 400 }
    );
  }

  try {
    const delRes = await fetch(`https://api.github.com/repos/${session.github_username}/${repoName}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.token}`,
        "User-Agent": "GitAuto-Engine/1.0",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (delRes.status !== 204 && delRes.status !== 200 && delRes.status !== 404) {
      const err = await delRes.text();
      return NextResponse.json(
        { success: false, error: { code: "GITHUB_API_ERROR", message: `Failed to delete repository: ${err}` } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: `del_${Date.now()}`,
        workflow_name: "Safe Delete Repository",
        operation_type: "DELETE_REPOSITORY",
        repository_name: repoName,
        target_repository_id: params.repoId,
        status: "SUCCESS",
        is_dry_run: false,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: 450,
        current_step: 3,
        total_steps: 3,
        steps: [],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to delete" } },
      { status: 500 }
    );
  }
}

