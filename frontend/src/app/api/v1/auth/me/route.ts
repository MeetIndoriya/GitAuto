import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session || !session.github_username) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: session.user_id || "1",
      github_user_id: Number(session.user_id) || 123456,
      github_username: session.github_username,
      avatar_url:
        session.avatar_url ||
        (session.github_username ? `https://avatars.githubusercontent.com/${session.github_username}` : null),
      email: session.email || `${session.github_username}@users.noreply.github.com`,
      created_at: new Date().toISOString(),
      connection: {
        status: "ACTIVE",
        scopes: ["repo", "read:user", "user:email"],
        rate_limit_remaining: 5000,
        rate_limit_total: 5000,
        rate_limit_reset_at: null,
      },
    },
    timestamp: new Date().toISOString(),
  });
}
