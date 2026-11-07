"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FolderGit2,
  Terminal,
  Play,
} from "lucide-react";
import { ShellLayout } from "@/components/layout/ShellLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { api } from "@/lib/api";
import { HistoryDetailResponse, WorkflowStepResponse } from "@/types";
import { formatDate, formatDuration, copyToClipboard } from "@/lib/utils";

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const executionId = params.executionId as string;

  const [detail, setDetail] = useState<HistoryDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await api.getHistoryDetail(executionId);
      setDetail(data);
    } catch (err: any) {
      toast.error("Execution record not found", err.message || "Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (executionId) {
      loadDetail();
    }
  }, [executionId]);

  const handleCopyId = async () => {
    if (!detail) return;
    const ok = await copyToClipboard(detail.id);
    if (ok) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      toast.info("Execution ID copied", detail.id);
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  return (
    <ShellLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <NextLink href="/history">
              <Button variant="outline" size="sm" className="h-9 px-2.5 gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>History</span>
              </Button>
            </NextLink>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Execution Audit Details</span>
              </h1>
              <p className="text-xs text-foreground-muted">
                Step-by-step verification trace and telemetry
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadDetail}
            disabled={loading}
            className="h-9 gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : !detail ? (
          <Card className="p-8 text-center text-foreground-muted">
            <p className="text-sm">Execution record not found.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/history")}
              className="mt-4"
            >
              Return to History
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Top Summary Card */}
            <Card className="overflow-hidden border-border bg-card">
              <CardHeader className="pb-4 bg-muted/20 border-b border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <CardTitle className="text-base font-bold font-mono text-foreground flex items-center gap-2">
                      <span>{detail.repository_name}</span>
                    </CardTitle>
                  </div>
                  <StatusBadge status={detail.status} />
                </div>
                <CardDescription className="text-xs text-foreground-muted">
                  {detail.workflow_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-foreground-subtle text-[11px]">Execution ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground truncate">{detail.id.slice(0, 12)}...</span>
                    <button
                      onClick={handleCopyId}
                      className="p-1 rounded text-foreground-subtle hover:text-foreground transition-colors"
                      title="Copy full Execution ID"
                    >
                      {copiedId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-foreground-subtle text-[11px]">Total Duration</span>
                  <p className="font-semibold text-foreground text-sm">{formatDuration(detail.duration_ms)}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-foreground-subtle text-[11px]">Started At</span>
                  <p className="text-foreground">{formatDate(detail.started_at)}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-foreground-subtle text-[11px]">Completed At</span>
                  <p className="text-foreground">{formatDate(detail.completed_at)}</p>
                </div>
              </CardContent>

              {detail.error_message && (
                <div className="mx-6 mb-6 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Workflow Error:</span>
                    <p className="mt-0.5 leading-relaxed">{detail.error_message}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Stepper Timeline Section */}
            <Card>
              <CardHeader className="pb-3 border-b border-border bg-muted/10">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Step-by-Step Execution Audit</span>
                  <span className="text-xs font-mono text-foreground-muted font-normal">
                    {detail.steps.filter((s) => s.status === "SUCCESS").length} of {detail.steps.length} Steps Completed
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative border-l-2 border-border ml-3 space-y-6 my-2">
                  {detail.steps.map((step, idx) => {
                    const isExpanded = !!expandedSteps[step.id];
                    const isSuccess = step.status === "SUCCESS";
                    const isFailed = step.status === "FAILED";
                    const isSkipped = step.status === "SKIPPED";

                    return (
                      <div key={step.id} className="relative pl-6 group">
                        {/* Status node dot */}
                        <div
                          className={`absolute -left-[9px] top-0.5 h-4 w-4 rounded-full border-2 bg-background flex items-center justify-center ${
                            isSuccess
                              ? "border-emerald-500 text-emerald-500"
                              : isFailed
                              ? "border-red-500 text-red-500"
                              : isSkipped
                              ? "border-muted-foreground text-muted-foreground"
                              : "border-sky-500 text-sky-500 animate-pulse"
                          }`}
                        >
                          {isSuccess && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                          {isFailed && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                          {isSkipped && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />}
                        </div>

                        {/* Step Card Container */}
                        <div className="rounded-lg border border-border bg-card/60 p-3.5 space-y-2 hover:border-border-focus transition-all">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-foreground-muted">
                                #{step.step_number}
                              </span>
                              <span className="text-xs font-semibold text-foreground">
                                {step.step_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-foreground-muted">
                                {formatDuration(step.duration_ms)}
                              </span>
                              <StatusBadge status={step.status} />
                            </div>
                          </div>

                          {/* HTTP metadata if applicable */}
                          {step.api_endpoint && (
                            <div className="flex items-center gap-2 text-[11px] font-mono text-foreground-subtle bg-muted/30 px-2 py-1 rounded">
                              <span className="font-semibold text-primary">{step.http_method || "HTTP"}</span>
                              <span className="truncate flex-1">{step.api_endpoint}</span>
                              {step.http_status_code && (
                                <span className={`font-semibold ${step.http_status_code < 300 ? "text-emerald-400" : "text-red-400"}`}>
                                  {step.http_status_code}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Step error traceback */}
                          {step.error_details && (
                            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono leading-relaxed">
                              {step.error_details}
                            </div>
                          )}

                          {/* Expandable JSON payload snapshot */}
                          {step.payload_snapshot && Object.keys(step.payload_snapshot).length > 0 && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => toggleStep(step.id)}
                                className="text-[11px] font-mono text-foreground-subtle hover:text-foreground flex items-center gap-1 transition-colors"
                              >
                                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                <span>{isExpanded ? "Hide Payload Snapshot" : "Inspect Payload Snapshot"}</span>
                              </button>
                              {isExpanded && (
                                <pre className="mt-2 p-2.5 rounded bg-zinc-950 text-[11px] font-mono text-zinc-300 border border-border overflow-x-auto">
                                  {JSON.stringify(step.payload_snapshot, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-2">
              <NextLink href="/history">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to History</span>
                </Button>
              </NextLink>
              <NextLink href="/automations/new">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>New Workflow</span>
                </Button>
              </NextLink>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
