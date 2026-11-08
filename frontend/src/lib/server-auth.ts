import { NextRequest } from "next/server";

export interface SessionData {
  user_id: string;
  github_username: string;
  avatar_url?: string;
  token: string;
  email?: string;
}

export function getSessionFromRequest(request: NextRequest): SessionData | null {
  // 1. Check Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.substring(7).trim();
    if (bearer.startsWith("ghp_") || bearer.startsWith("gho_") || bearer.startsWith("github_pat_")) {
      return {
        user_id: "user",
        github_username: "user",
        token: bearer,
      };
    }
  }

  // 2. Check session cookie
  const sessionCookie = request.cookies.get("gitauto_session")?.value;
  if (!sessionCookie) return null;

  try {
    let raw = sessionCookie.trim();
    if (raw.startsWith("%7B") || raw.startsWith("%7b")) {
      raw = decodeURIComponent(raw);
    }

    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.token || parsed.github_username)) {
        return {
          user_id: String(parsed.user_id || "123456"),
          github_username: parsed.github_username || parsed.login || "user",
          avatar_url: parsed.avatar_url || (parsed.github_username ? `https://avatars.githubusercontent.com/${parsed.github_username}` : undefined),
          token: parsed.token || "",
          email: parsed.email,
        };
      }
    }

    // JWT format: header.payload.signature
    const parts = raw.split(".");
    if (parts.length === 3) {
      const payload = Buffer.from(parts[1], "base64").toString("utf-8");
      const jwtData = JSON.parse(payload);
      const username = jwtData.github_username || jwtData.username || jwtData.login;
      if (!username) return null;
      return {
        user_id: String(jwtData.sub || jwtData.user_id || "123456"),
        github_username: username,
        avatar_url: jwtData.avatar_url || `https://avatars.githubusercontent.com/${username}`,
        token: jwtData.token || "",
        email: jwtData.email || `${username}@users.noreply.github.com`,
      };
    }
  } catch {
    return null;
  }
  return null;
}
