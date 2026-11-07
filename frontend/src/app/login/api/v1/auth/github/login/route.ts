import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "redirect";

  const clientId = process.env.GITHUB_CLIENT_ID || "Ov23liqMpIvxYOHYvCch";
  const redirectUri = process.env.GITHUB_REDIRECT_URI || "https://github--auto.vercel.app/login/api/v1/auth/github/callback";

  // Check if request originated from local machine
  const host = request.headers.get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

  const rawState = crypto.randomBytes(16).toString("hex");
  const state = isLocal ? `local_${rawState}` : rawState;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo,read:user,user:email",
    state: state,
    response_type: "code",
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  if (format === "json") {
    const res = NextResponse.json({
      success: true,
      data: {
        authorization_url: githubAuthUrl,
        state: state,
      },
    });
    res.cookies.set("gitauto_oauth_state", rawState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  }

  const response = NextResponse.redirect(githubAuthUrl);
  response.cookies.set("gitauto_oauth_state", rawState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}

