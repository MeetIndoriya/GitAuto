import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || "")}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  // If OAuth was initiated on local machine, forward back to localhost backend
  if (state && state.startsWith("local_")) {
    return NextResponse.redirect(
      `http://localhost:8000/api/v1/auth/github/callback?code=${code}&state=${state}`
    );
  }

  // Otherwise, handle OAuth directly on Vercel
  const clientId = process.env.GITHUB_CLIENT_ID || "Ov23liqMpIvxYOHYvCch";
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || "d92682c859a8e0596927d581fa5c111b2cc47349";
  const redirectUri = process.env.GITHUB_REDIRECT_URI || "https://github--auto.vercel.app/login/api/v1/auth/github/callback";

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "GitAuto-OAuth/1.0",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      const err = tokenData.error_description || tokenData.error || "Token exchange failed";
      return NextResponse.redirect(new URL(`/login?error=oauth_failed&description=${encodeURIComponent(err)}`, request.url));
    }

    const accessToken = tokenData.access_token;

    // Fetch GitHub Profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "GitAuto-Vercel/1.0",
      },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/login?error=profile_fetch_failed", request.url));
    }

    const userProfile = await userRes.json();

    // Commercial Multi-Tenant Mode: Every GitHub user is permitted
    // Optional allowlist only active if explicitly set to something other than "*" and not empty
    const allowlistEnv = process.env.AUTHORIZED_GITHUB_USER;
    if (allowlistEnv && allowlistEnv.trim() !== "" && allowlistEnv.trim() !== "*") {
      const authorized = allowlistEnv.split(",").map((u) => u.trim().toLowerCase());
      if (authorized.length > 0 && !authorized.includes(userProfile.login.toLowerCase())) {
        return NextResponse.redirect(
          new URL(
            `/login?error=unauthorized_account&description=${encodeURIComponent(
              `Account @${userProfile.login} is not authorized on this private instance.`
            )}`,
            request.url
          )
        );
      }
    }

    // Session cookie payload
    const sessionPayload = {
      user_id: String(userProfile.id),
      github_username: userProfile.login,
      avatar_url: userProfile.avatar_url,
      token: accessToken,
      email: userProfile.email || `${userProfile.login}@users.noreply.github.com`,
    };

    const host = request.headers.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("gitauto_session", JSON.stringify(sessionPayload), {
      httpOnly: false,
      secure: !isLocal,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 14,
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/login?error=callback_error&description=${encodeURIComponent(err.message || "An error occurred")}`, request.url)
    );
  }
}

