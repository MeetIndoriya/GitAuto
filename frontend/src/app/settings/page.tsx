"use client";

import React from "react";
import NextLink from "next/link";
import {
  Settings,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  User,
  LogOut,
  Sliders,
  Zap,
  ArrowRight,
} from "lucide-react";
import { ShellLayout } from "@/components/layout/ShellLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/ToastProvider";

export default function SettingsPage() {
  const { theme, resolvedTheme, setTheme, highContrast, setHighContrast } = useTheme();
  const { user, logout } = useAuth();
  const toast = useToast();

  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme);
    toast.success("Theme Updated", `Interface appearance set to ${newTheme.toUpperCase()} mode.`);
  };

  const THEME_OPTIONS = [
    {
      id: "dark" as const,
      name: "Dark Obsidian",
      description: "Deep obsidian surfaces with vibrant high-contrast accents. Best for low light.",
      icon: Moon,
      previewBg: "bg-zinc-950",
      previewCard: "bg-zinc-900 border-zinc-800",
      previewText: "text-zinc-100",
    },
    {
      id: "light" as const,
      name: "Daylight Crisp",
      description: "Clean daylight palette with crisp typography and subtle borders.",
      icon: Sun,
      previewBg: "bg-zinc-100",
      previewCard: "bg-white border-zinc-200",
      previewText: "text-zinc-900",
    },
    {
      id: "system" as const,
      name: "System Sync",
      description: "Dynamically matches your operating system appearance preference.",
      icon: Laptop,
      previewBg: "bg-gradient-to-r from-zinc-100 to-zinc-950",
      previewCard: "bg-zinc-800/80 border-zinc-700",
      previewText: "text-white",
    },
  ];

  return (
    <ShellLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="space-y-1 pb-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Settings className="h-7 w-7 text-primary" />
            <span>Application Settings & Preferences</span>
          </h1>
          <p className="text-sm font-semibold text-foreground-muted">
            Manage your interface appearance, display layout, and account session controls.
          </p>
        </div>

        <div className="space-y-6">
          {/* 1. Interactive Theme Changer */}
          <Card>
            <CardHeader className="pb-4 border-b border-border bg-muted/10">
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <span>Theme & Color Appearance</span>
              </CardTitle>
              <CardDescription className="text-xs font-semibold">
                Select your preferred color scheme for the GitAuto console. Changes apply immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {THEME_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = theme === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleThemeChange(opt.id)}
                      className={`relative p-5 rounded-2xl border text-left transition-all flex flex-col justify-between group ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-lg"
                          : "border-border bg-card/60 hover:border-border-focus hover:bg-muted/40 shadow-xs"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div
                            className={`p-2.5 rounded-xl ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted text-foreground-muted group-hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-5 w-5 stroke-[2.5]" />
                          </div>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-xs font-extrabold text-primary bg-primary/15 px-2 py-0.5 rounded-full border border-primary/20">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                              Active
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-foreground tracking-tight">{opt.name}</h3>
                          <p className="text-xs font-medium text-foreground-muted mt-1 leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                      </div>

                      {/* Mini Theme Preview Widget */}
                      <div className={`mt-4 p-2.5 rounded-xl border ${opt.previewBg} border-border/80 flex items-center gap-2 overflow-hidden`}>
                        <div className={`h-4 w-4 rounded-full ${opt.previewCard} flex items-center justify-center`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <div className="h-2 w-14 rounded bg-border" />
                        <div className="h-2 w-8 rounded bg-primary/40 ml-auto" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Resolved Theme Indicator */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-foreground-muted">Effective Applied Mode:</span>
                <span className="text-foreground flex items-center gap-2 uppercase">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {resolvedTheme} mode active
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 2. Display & Layout Preferences */}
          <Card>
            <CardHeader className="pb-4 border-b border-border bg-muted/10">
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Sliders className="h-5 w-5 text-sky-400" />
                <span>Display & Layout Preferences</span>
              </CardTitle>
              <CardDescription className="text-xs font-semibold">
                Accessibility and visual contrast controls
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/60">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-foreground">High Contrast Borders</span>
                  <p className="text-xs font-medium text-foreground-muted">
                    Enhance border thickness and contrast outlines across all cards, inputs, and components.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !highContrast;
                    setHighContrast(next);
                    toast.info("High Contrast", next ? "High contrast borders enabled." : "Standard contrast restored.");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    highContrast
                      ? "border-primary bg-primary text-primary-foreground font-extrabold shadow-sm"
                      : "border-border bg-muted/40 text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {highContrast ? "Enabled" : "Disabled"}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 3. Account & Active Session */}
          <Card>
            <CardHeader className="pb-4 border-b border-border bg-muted/10">
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span>Connected GitHub Account</span>
              </CardTitle>
              <CardDescription className="text-xs font-semibold">
                Your authenticated GitHub profile for direct automation execution
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/60">
                <div className="flex items-center gap-3">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.github_username}
                      className="h-12 w-12 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                      {user?.github_username?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      @{user?.github_username || "user"}
                    </h4>
                    <p className="text-xs font-mono font-medium text-foreground-muted">
                      GitHub ID: {user?.github_user_id || "123456"}
                    </p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={logout}
                  className="font-bold gap-2 text-xs"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                  <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Automations run directly on your connected GitHub account.</span>
                </div>
                <NextLink href="/automations/new">
                  <Button variant="primary" size="sm" className="h-9 text-xs font-bold gap-1.5 shadow-sm">
                    <span>Set Automation on GitHub</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </NextLink>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ShellLayout>
  );
}
