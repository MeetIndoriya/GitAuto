import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    data: { success: true, message: "Logged out successfully" },
  });
  response.cookies.set("gitauto_session", "", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

