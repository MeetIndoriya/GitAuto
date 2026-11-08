"use client";

import React, { useEffect, useState, useRef } from "react";
import NextLink from "next/link";
import {
  Sparkles,
  Layers,
  FolderGit2,
  CheckCircle2,
  Trash2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Palette,
  History,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { ShellLayout } from "@/components/layout/ShellLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { DashboardSummary } from "@/types";
import { formatDate, formatDuration, formatRelativeTime } from "@/lib/utils";
import { animateCardStagger } from "@/lib/animations";

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);

  const handleQuickContributionBoost = async () => {
    try {
      setBoosting(true);
      const generatedName = `gitauto-${Date.now().toString().slice(-6)}`;
      const today = new Date().toISOString().split("T")[0];
      const result = await api.createAutomation({
        repository_name: generatedName,
        description: `Automated contribution boost for ${today} by GitAuto.`,
        visibility: "public",
        default_branch: "main",
        init_readme: true,
        gitignore_template: "None",
        is_dry_run: false,
        auto_delete: true,
        commits_count: 2,
        commits_per_day: 2,
        start_date: today,
        end_date: today,
        repo_prefix: "gitauto-",
      });
      if (result.status === "SUCCESS") {
        toast.success(
          "2 Contributions Boosted!",
          `Created repository '${generatedName}', pushed 2 contribution commits, and safely cleaned up.`
        );
      } else {
        toast.error("Notice", result.error_message || "Operation completed.");
      }
      await loadData();
    } catch (err: any) {
      toast.error("Boost failed", err.message || "Failed to trigger contribution boost");
    } finally {
      setBoosting(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load dashboard summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll(".metric-card-item");
      if (cards.length > 0) {
        animateCardStagger(cards);
      }
    }
  }, [loading]);

  const metrics = summary?.metrics;
  const recent = summary?.recent_activity || [];

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <span>Welcome back,</span>
              <span className="text-foreground font-mono font-bold">@{user?.github_username || "user"}</span>
            </h1>
            <p className="text-sm font-medium text-foreground-muted">
              GitHub repository lifecycle management & audit overview.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh Metrics"
              className="h-10 px-4 text-xs font-bold"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <NextLink href="/automations/new">
              <Button size="sm" variant="primary" className="h-10 px-4 text-xs font-bold shadow-sm gap-2">
                <Sparkles className="h-4 w-4" />
                <span>New Automation</span>
              </Button>
            </NextLink>
          </div>
        </div>

        {/* Commercial Feature: Instant Contribution Boost Banner */}
        <div className="p-5 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-emerald-500/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400 fill-amber-400" />
              <h3 className="text-base font-bold text-foreground">Instant Contribution Booster</h3>
              <span className="text-[10px] font-mono uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Auto-Delete & Cleanup
              </span>
            </div>
            <p className="text-xs font-medium text-foreground-muted">
              Creates a temporary prefixed repo, pushes 2 contribution commits to your profile activity, and cleanly auto-deletes the repo.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={handleQuickContributionBoost}
              isLoading={boosting}
              disabled={boosting}
              className="font-bold shadow-md gap-2 h-10 px-4"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>Boost 2 Contributions Now</span>
            </Button>
            <NextLink href="/automations/new">
              <Button
                variant="outline"
                size="sm"
                className="font-bold border-primary/30 text-foreground hover:bg-primary/10 gap-2 h-10 px-4"
              >
                <span>📅 Schedule Date Range</span>
              </Button>
            </NextLink>
          </div>
        </div>

        {/* 4 Telemetry Metrics Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))
          ) : (
            <>
              <div className="metric-card-item">
                <MetricCard
                  title="Total Automations"
                  value={metrics?.total_executions ?? 0}
                  subtitle="All-time workflow runs"
                  icon={Layers}
                  variant="default"
                />
              </div>
              <div className="metric-card-item">
                <MetricCard
                  title="Active Managed Repos"
                  value={metrics?.active_managed_repositories ?? 0}
                  subtitle="Currently provisioned"
                  icon={FolderGit2}
                  variant="success"
                />
              </div>
              <div className="metric-card-item">
                <MetricCard
                  title="Success Rate"
                  value={`${metrics?.success_rate_percentage ?? 100}%`}
                  subtitle={`${metrics?.successful_executions ?? 0} successful runs`}
                  icon={CheckCircle2}
                  variant="info"
                />
              </div>
              <div className="metric-card-item">
                <MetricCard
                  title="Repositories Cleaned"
                  value={metrics?.deleted_repositories ?? 0}
                  subtitle="Safely deleted with logs"
                  icon={Trash2}
                  variant="warning"
                />
              </div>
            </>
          )}
        </div>

        {/* Quick Launch & Status Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Executions (2 Cols) */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <History className="h-5 w-5 text-foreground-muted" />
                  <span>Recent Executions</span>
                </CardTitle>
                <CardDescription className="text-sm font-medium">
                  Latest repository provisioning and cleanup workflows
                </CardDescription>
              </div>
              <NextLink href="/history">
                <Button variant="ghost" size="sm" className="text-xs font-bold gap-1.5 h-9">
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </NextLink>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {loading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : recent.length === 0 ? (
                <EmptyState
                  title="No automation runs yet"
                  description="Start by creating your first automated repository scaffolding workflow."
                  actionLabel="Start Automation"
                  onAction={() => (window.location.href = "/automations/new")}
                  className="my-6 border-0 bg-transparent"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow / Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Duration</TableHead>
                      <TableHead className="text-right">Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((run) => (
                      <TableRow
                        key={run.id}
                        className="cursor-pointer hover:bg-muted/60 transition-colors"
                        onClick={() => (window.location.href = `/history/${run.id}`)}
                      >
                        <TableCell className="font-semibold">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground flex items-center gap-2 font-mono">
                              {run.repository_name}
                            </span>
                            <span className="text-xs font-medium text-foreground-muted truncate">
                              {run.workflow_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={run.status} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs font-mono font-bold text-foreground-muted">
                          {formatDuration(run.duration_ms)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-foreground-muted">
                          {formatRelativeTime(run.started_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Quick Launch & Security Status */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription className="text-sm font-medium">
                  Common repository automation tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <NextLink href="/automations/new" className="block">
                  <div className="p-3.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                        <FolderGit2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Scaffold Microservice</p>
                        <p className="text-xs font-medium text-foreground-muted">Node/Python boilerplate</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
                  </div>
                </NextLink>

                <NextLink href="/repositories" className="block">
                  <div className="p-3.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Trash2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Repository Lifecycle</p>
                        <p className="text-xs font-medium text-foreground-muted">Safe verified teardown</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
                  </div>
                </NextLink>

                <NextLink href="/settings" className="block">
                  <div className="p-3.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Palette className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Theme & Display Settings</p>
                        <p className="text-xs font-medium text-foreground-muted">Customize dark/light & layout</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
                  </div>
                </NextLink>
              </CardContent>
            </Card>

            {/* Account Guardrails Notice */}
            <Card className="border-border bg-muted/20">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                  <span>Instance Security Guarantee</span>
                </div>
                <p className="text-xs font-medium text-foreground-muted leading-relaxed">
                  Only repositories created by this GitAuto instance are eligible for automated teardown. Unmanaged repositories are strictly shielded from accidental modification.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
