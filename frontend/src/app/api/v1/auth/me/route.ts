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
        session = {
          user_id: jwtData.sub || "123456",
          github_username: jwtData.username || "MeetIndoriya",
          avatar_url: `https://avatars.githubusercontent.com/u/${jwtData.sub || 123456}?v=4`,
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
        avatar_url: session.avatar_url || `https://avatars.githubusercontent.com/u/123456?v=4`,
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

