import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // If backend is configured, try proxying first
  const backendUrl = process.env.BACKEND_URL;
  if (backendUrl && backendUrl !== "http://localhost:8000") {
    try {
      const beRes = await fetch(`${backendUrl}/api/v1/auth/me`, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });
      if (beRes.ok) {
        const data = await beRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to local cookie inspection
    }
  }

  const sessionCookie = request.cookies.get("gitauto_session")?.value;
  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  try {
    let session: any = null;
    if (sessionCookie.startsWith("{")) {
      session = JSON.parse(sessionCookie);
    } else {
      // Base64 or JWT payload decoding
      const parts = sessionCookie.split(".");
      if (parts.length === 3) {
        const payload = Buffer.from(parts[1], "base64").toString("utf-8");
        const jwtData = JSON.parse(payload);
        const username = jwtData.github_username || jwtData.username || jwtData.login;
        if (!username) {
          return NextResponse.json(
            { success: false, error: { code: "UNAUTHORIZED", message: "Invalid session token" } },
            { status: 401 }
          );
        }
        session = {
          user_id: String(jwtData.sub || jwtData.user_id || "123456"),
          github_username: username,
          avatar_url: jwtData.avatar_url || `https://avatars.githubusercontent.com/${username}`,
          token: jwtData.token || "",
          email: jwtData.email || `${username}@users.noreply.github.com`,
        };
      }
    }

    if (!session || !session.github_username) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid session" } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.user_id || "1",
        github_user_id: Number(session.user_id) || 123456,
        github_username: session.github_username,
        avatar_url: session.avatar_url || (session.github_username ? `https://avatars.githubusercontent.com/${session.github_username}` : null),
        email: session.email || `${session.github_username}@users.noreply.github.com`,
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Failed to parse session" } },
      { status: 401 }
    );
  }
}

