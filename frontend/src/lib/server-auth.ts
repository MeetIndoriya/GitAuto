import { NextRequest } from "next/server";

export interface SessionData {
  user_id: string;
  github_username: string;
  avatar_url?: string;
  token: string;
  email?: string;
}

export function getSessionFromRequest(request: NextRequest): SessionData | null {
  const sessionCookie = request.cookies.get("gitauto_session")?.value;
  if (!sessionCookie) return null;

  try {
    if (sessionCookie.startsWith("{")) {
      return JSON.parse(sessionCookie);
    }
    const parts = sessionCookie.split(".");
    if (parts.length === 3) {
      const payload = Buffer.from(parts[1], "base64").toString("utf-8");
      const jwtData = JSON.parse(payload);
      return {
        user_id: String(jwtData.sub || "123456"),
        github_username: jwtData.username || "user",
        avatar_url: `https://avatars.githubusercontent.com/u/${jwtData.sub || 123456}?v=4`,
        token: jwtData.token || "",
      };
    }
  } catch {
    return null;
  }
  return null;
}

