"use client";

import React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("inline-flex items-center rounded-lg border border-border bg-muted/60 p-1", className)}>
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "rounded-md p-1.5 text-foreground-muted hover:text-foreground transition-all",
          theme === "light" && "bg-background text-foreground shadow-sm"
        )}
        title="Light Theme"
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "rounded-md p-1.5 text-foreground-muted hover:text-foreground transition-all",
          theme === "dark" && "bg-background text-foreground shadow-sm"
        )}
        title="Dark Theme"
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={cn(
          "rounded-md p-1.5 text-foreground-muted hover:text-foreground transition-all",
          theme === "system" && "bg-background text-foreground shadow-sm"
        )}
        title="System Theme"
      >
        <Laptop className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
