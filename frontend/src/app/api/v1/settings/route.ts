import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server-auth";

let inMemorySettings = {
  repository_defaults: {
    default_visibility: "private" as const,
    default_branch: "main",
    default_gitignore: "Node",
    default_init_readme: true,
    naming_prefix: "gitauto-",
  },
  automation_preferences: {
    enable_dry_run_by_default: false,
    auto_verify_commits: true,
    request_timeout_seconds: 10.0,
    theme_preference: "dark" as const,
  },
  environment: "production",
};

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  return NextResponse.json({
    success: true,
    data: {
      ...inMemorySettings,
      authorized_user: session?.github_username || "all_users",
    },
    timestamp: new Date().toISOString(),
  });
}

export async function PUT(request: NextRequest) {
  const session = getSessionFromRequest(request);
  try {
    const body = await request.json();
    if (body.repository_defaults) {
      inMemorySettings.repository_defaults = {
        ...inMemorySettings.repository_defaults,
        ...body.repository_defaults,
      };
    }
    if (body.automation_preferences) {
      inMemorySettings.automation_preferences = {
        ...inMemorySettings.automation_preferences,
        ...body.automation_preferences,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        ...inMemorySettings,
        authorized_user: session?.github_username || "all_users",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err.message || "Failed to update settings" } },
      { status: 400 }
    );
  }
}

