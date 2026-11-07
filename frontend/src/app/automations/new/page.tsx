"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Play,
  Lock,
  Globe,
  FileCode,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Settings2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Infinity as InfinityIcon,
  Activity,
} from "lucide-react";
import { ShellLayout } from "@/components/layout/ShellLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/ToastProvider";
import { api } from "@/lib/api";
import { CreateWorkflowRequest, WorkflowRunResponse } from "@/types";
import { formatDuration } from "@/lib/utils";

const GITIGNORE_OPTIONS = ["Node", "Python", "Go", "Rust", "None"];

export default function NewAutomationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [initReadme, setInitReadme] = useState(true);
  const [gitignoreTemplate, setGitignoreTemplate] = useState("Node");
  const [customReadme, setCustomReadme] = useState("");

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<WorkflowRunResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Load user settings defaults
  useEffect(() => {
    api
      .getSettings()
      .then((settings) => {
        if (settings.repository_defaults) {
          setVisibility(settings.repository_defaults.default_visibility);
          setDefaultBranch(settings.repository_defaults.default_branch || "main");
          setGitignoreTemplate(settings.repository_defaults.default_gitignore || "Node");
          setInitReadme(settings.repository_defaults.default_init_readme ?? true);
          if (settings.repository_defaults.naming_prefix) {
            setRepoName(`${settings.repository_defaults.naming_prefix}`);
          }
        }
      })
      .catch((err) => console.error("Failed to load settings defaults", err));
  }, []);

  // Validation
  const isValidName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) return false;
    if (trimmed === "." || trimmed === "..") return false;
    if (trimmed.startsWith(".") || trimmed.startsWith("-") || trimmed.endsWith(".") || trimmed.endsWith("-")) return false;
    return /^[a-zA-Z0-9_\-\.]+$/.test(trimmed);
  };

  const nameError = repoName.length > 0 && !isValidName(repoName);

  // Compute preview readme
  const generatedReadme =
    customReadme.trim() ||
    `# ${repoName || "project-name"}

${description.trim() || "Automated repository provisioned with GitAuto."}

## Overview
This repository is managed continuously by the GitAuto Lifecycle Engine.

- **Visibility**: ${visibility}
- **Default Branch**: ${defaultBranch}
- **Stack / Template**: ${gitignoreTemplate !== "None" ? gitignoreTemplate : "Custom"}
- **Daemon Mode**: Continuous Active Monitor (Runs Forever)

## Getting Started

\`\`\`bash
git clone https://github.com/${user?.github_username || "user"}/${repoName || "project-name"}.git
cd ${repoName || "project-name"}
\`\`\`
`;

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidName(repoName)) {
      toast.error("Invalid repository name", "Please enter a valid GitHub repository name.");
      return;
    }

    try {
      setIsExecuting(true);
      const payload: CreateWorkflowRequest = {
        repository_name: repoName.trim(),
        description: description.trim(),
        visibility,
        default_branch: defaultBranch.trim() || "main",
        init_readme: initReadme,
        readme_template: customReadme.trim() || undefined,
        gitignore_template: gitignoreTemplate,
        is_dry_run: false,
      };

      const result = await api.createAutomation(payload);
      setExecutionResult(result);
      setModalOpen(true);

      if (result.status === "SUCCESS" || result.status === "RUNNING_FOREVER") {
        toast.success(
          "Automation Deployed & Running Forever",
          `Repository '${repoName.trim()}' is live. Continuous monitoring daemon is active indefinitely.`
        );
      } else if (result.status === "PARTIAL_FAILURE") {
        toast.warning(
          "Partial workflow completion",
          "Repository was created on GitHub, but initial content scaffolding encountered an issue."
        );
      } else {
        toast.error("Workflow execution failed", result.error_message || "An error occurred.");
      }
    } catch (err: any) {
      toast.error("Failed to execute automation", err.message || "An unexpected error occurred");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <ShellLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-primary" />
            <span>New Repository Automation</span>
          </h1>
          <p className="text-sm font-semibold text-foreground-muted">
            Configure repository properties, scaffold starter files, and deploy a daemon that runs forever.
          </p>
        </div>

        <form onSubmit={handleExecute} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Repository Details Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-foreground-muted" />
                  <span>Repository Properties</span>
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Define repository identifier and visibility on GitHub
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Repository Name */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-foreground">
                      Repository Name <span className="text-red-400">*</span>
                    </label>
                    <span className="text-xs font-mono font-medium text-foreground-muted">
                      github.com/{user?.github_username || "user"}/<strong className="text-foreground">{repoName || "..."}</strong>
                    </span>
                  </div>
                  <Input
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="e.g. microservice-core-service"
                    error={nameError}
                    required
                    className="font-mono text-sm h-10 font-bold"
                  />
                  {nameError && (
                    <p className="text-xs font-semibold text-red-400">
                      Alphanumeric characters, hyphens, dots, and underscores only.
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Description (Optional)</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief summary of what this repository does"
                    maxLength={350}
                    className="h-10 text-sm font-medium"
                  />
                </div>

                {/* Visibility Toggle */}
                <div className="space-y-2 pt-1">
                  <label className="text-sm font-bold text-foreground">Visibility</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibility("private")}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        visibility === "private"
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                          : "border-border bg-card/50 text-foreground-muted hover:border-border-focus"
                      }`}
                    >
                      <Lock className={`h-4.5 w-4.5 mt-0.5 ${visibility === "private" ? "text-primary" : ""}`} />
                      <div>
                        <p className="text-sm font-bold text-foreground">Private</p>
                        <p className="text-xs font-medium text-foreground-muted">Only you can access</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVisibility("public")}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        visibility === "public"
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                          : "border-border bg-card/50 text-foreground-muted hover:border-border-focus"
                      }`}
                    >
                      <Globe className={`h-4.5 w-4.5 mt-0.5 ${visibility === "public" ? "text-primary" : ""}`} />
                      <div>
                        <p className="text-sm font-bold text-foreground">Public</p>
                        <p className="text-xs font-medium text-foreground-muted">Visible to everyone</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Default branch */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-sm font-bold text-foreground">Default Branch</label>
                  <Input
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    placeholder="main"
                    className="font-mono text-sm max-w-xs font-bold"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Scaffolding & Initial Content */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-foreground-muted" />
                  <span>Initial Content Scaffolding</span>
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Automate boilerplate files and starter commits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* README checkbox */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Generate README.md</p>
                      <p className="text-[11px] font-medium text-foreground-muted">Structured markdown documentation</p>
                    </div>
                  </div>
                  <Switch checked={initReadme} onCheckedChange={setInitReadme} />
                </div>

                {/* .gitignore selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">.gitignore Template</label>
                  <div className="flex flex-wrap gap-2">
                    {GITIGNORE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setGitignoreTemplate(opt)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                          gitignoreTemplate === opt
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:bg-muted text-foreground-muted"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Perpetual Daemon Indicator Card */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                        <InfinityIcon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">Continuous Daemon Execution</span>
                          <span className="text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">Runs Forever</span>
                        </div>
                        <p className="text-[11px] font-medium text-foreground-muted mt-0.5">
                          Once deployed, this automation remains persistently active for your account, continuously monitoring repository status.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Execute Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isExecuting}
                disabled={!isValidName(repoName) || isExecuting}
                className="w-full h-12 text-base font-extrabold tracking-wide justify-center shadow-lg gap-2"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Deploy Automation (Runs Forever)</span>
              </Button>
            </div>
          </div>

          {/* Right Live Preview Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-sky-400" />
                  <span>Execution Sequence Plan</span>
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Automated operations pipeline to be executed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stepper overview */}
                <div className="space-y-2 text-xs font-mono font-semibold">
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Assert GitHub Authorization & Scopes</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Create remote repo: <strong className="text-foreground">{repoName || "..."}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Register immutable GitAuto ID in DB</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">4</span>
                    <span>Generate README & {gitignoreTemplate} .gitignore</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">5</span>
                    <span>Commit and push initial content to '{defaultBranch}'</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">6</span>
                    <span>Verify commit SHA on remote branch HEAD</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">7</span>
                    <span>Spawn Continuous Lifecycle Daemon (Runs Forever)</span>
                  </div>
                </div>

                {/* Generated README Markdown Preview */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground">README.md Preview</span>
                    <span className="text-[10px] text-foreground-subtle font-mono font-bold">Markdown</span>
                  </div>
                  <pre className="p-3 rounded-lg border border-border bg-muted/40 text-[11px] font-mono font-semibold text-foreground-muted whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                    {generatedReadme}
                  </pre>
                </div>

                {/* Safety Guarantee pill */}
                <div className="p-3 rounded-lg border border-border bg-card/60 flex items-center gap-2 text-[11px] font-semibold text-foreground-muted">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Isolated workflow. Will not delete repository on partial failure.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>

        {/* Live Execution Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent onClose={() => setModalOpen(false)} className="max-w-xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <span>Automation Deployed (Running Forever)</span>
                </DialogTitle>
                {executionResult && <StatusBadge status={executionResult.status} />}
              </div>
              <DialogDescription className="font-mono text-xs font-semibold text-foreground-muted">
                Execution ID: <span className="font-mono text-foreground font-bold">{executionResult?.id}</span>
              </DialogDescription>
            </DialogHeader>

            {executionResult && (
              <div className="space-y-4 my-2">
                {/* Stepper Timeline */}
                <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/30">
                  {executionResult.steps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0 font-medium">
                      <div className="flex items-center gap-2 min-w-0">
                        {step.status === "SUCCESS" && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                        {step.status === "FAILED" && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
                        {step.status === "IN_PROGRESS" && <Loader2 className="h-4 w-4 animate-spin text-sky-400 shrink-0" />}
                        <span className="font-bold text-foreground truncate">{step.step_name}</span>
                      </div>
                      <span className="font-mono text-[11px] text-foreground-muted shrink-0 ml-2 font-bold">
                        {formatDuration(step.duration_ms)}
                      </span>
                    </div>
                  ))}
                  {/* Step 7 Daemon representation */}
                  <div className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0 font-medium text-emerald-400">
                    <div className="flex items-center gap-2 min-w-0">
                      <InfinityIcon className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />
                      <span className="font-bold">Continuous Lifecycle Daemon Active</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      RUNNING FOREVER
                    </span>
                  </div>
                </div>

                {/* Duration & status summary */}
                <div className="flex justify-between items-center text-xs text-foreground-muted font-mono font-bold px-1">
                  <span>Initial Provision: <strong className="text-foreground">{formatDuration(executionResult.duration_ms)}</strong></span>
                  <span>Daemon State: <strong className="text-emerald-400">ACTIVE FOREVER</strong></span>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Close
              </Button>
              {executionResult && (
                <NextLink href={`/history/${executionResult.id}`}>
                  <Button variant="primary" className="gap-1.5 font-bold">
                    <span>Inspect Full Audit Log</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </NextLink>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ShellLayout>
  );
}
