import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL;
  if (backendUrl && backendUrl !== "http://localhost:8000") {
    try {
      const beRes = await fetch(`${backendUrl}/api/v1/repositories`, {
        headers: { cookie: request.headers.get("cookie") || "" },
      });
      if (beRes.ok) return NextResponse.json(await beRes.json());
    } catch {
      // Fallback
    }
  }

  const session = getSessionFromRequest(request);
  if (!session || !session.token) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const ghRes = await fetch("https://api.github.com/user/repos?sort=created&direction=desc&per_page=50", {
      headers: {
        Authorization: `Bearer ${session.token}`,
        "User-Agent": "GitAuto-Engine/1.0",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!ghRes.ok) {
      return NextResponse.json({ success: true, data: [] });
    }

    const repos = await ghRes.json();
    const mapped = repos.map((r: any) => ({
      id: String(r.id),
      github_repository_id: r.id,
      github_node_id: r.node_id,
      repository_name: r.name,
      repository_full_name: r.full_name,
      visibility: r.private ? "private" : "public",
      default_branch: r.default_branch || "main",
      status: "ACTIVE",
      workflow_run_id: null,
      remote_created_at: r.created_at,
      remote_deleted_at: null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

