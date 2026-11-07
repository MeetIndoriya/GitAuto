"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import NextLink from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";

export function Topbar({ onOpenMobileSidebar }: { onOpenMobileSidebar: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const getBreadcrumb = () => {
    if (pathname === "/dashboard") return "Dashboard / Overview";
    if (pathname.startsWith("/automations/new")) return "Automations / New Workflow";
    if (pathname.startsWith("/automations")) return "Automations / Pipeline";
    if (pathname.startsWith("/repositories")) return "Repositories / Managed";
    if (pathname.startsWith("/history/")) return "History / Execution Audit";
    if (pathname.startsWith("/history")) return "History / Audit Logs";
    if (pathname.startsWith("/settings")) return "Settings / Preferences";
    return "GitAuto / Console";
  };

  return (
    <header className="h-16 border-b border-border bg-background/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-xs font-mono font-bold text-foreground uppercase tracking-widest hidden sm:inline-block">
          {getBreadcrumb()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick action button */}
        {pathname !== "/automations/new" && (
          <NextLink href="/automations/new">
            <Button size="sm" variant="primary" className="h-9 shadow-xs font-bold gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Workflow</span>
            </Button>
          </NextLink>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
