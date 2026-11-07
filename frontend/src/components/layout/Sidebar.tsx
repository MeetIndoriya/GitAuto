"use client";

import React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  FolderGit2,
  History,
  Settings,
  LogOut,
  GitBranch,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Automation", href: "/automations/new", icon: Sparkles },
  { label: "Repositories", href: "/repositories", icon: FolderGit2 },
  { label: "Execution History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className, onClose }: { className?: string; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-64 border-r border-border bg-background-subtle/70 backdrop-blur-md select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
        <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
          <GitBranch className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-2">
            GitAuto
            <span className="text-xs uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
              v1.0
            </span>
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
          Platform
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/settings" && pathname.startsWith(item.href));

          return (
            <NextLink
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all group",
                isActive
                  ? "bg-muted text-foreground font-bold shadow-xs"
                  : "text-foreground-muted hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 transition-colors",
                  isActive ? "text-foreground stroke-[2.5]" : "text-foreground-muted group-hover:text-foreground stroke-[2]"
                )}
              />
              <span className="tracking-tight">{item.label}</span>
            </NextLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3.5 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.github_username}
              className="h-9 w-9 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
              {user?.github_username?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground truncate">
              @{user?.github_username || "octocat"}
            </span>
            <span className="text-xs text-foreground-muted font-mono font-medium truncate">
              Single-User Node
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          title="Log Out"
          className="p-2 rounded-lg text-foreground-muted hover:text-destructive hover:bg-destructive-bg transition-colors"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </aside>
  );
}
