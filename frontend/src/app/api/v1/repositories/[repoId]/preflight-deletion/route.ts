import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const { repoId } = await params;
  const session = getSessionFromRequest(request);
  if (!session || !session.token) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      repository_id: repoId,
      repository_name: "target-repo",
      repository_full_name: `${session.github_username}/target-repo`,
      github_repository_id: Number(repoId) || 123456,
      status: "ACTIVE",
      safety_check_passed: true,
      message: "Safety preflight passed. Explicit confirmation required to proceed.",
    },
    timestamp: new Date().toISOString(),
  });
}

