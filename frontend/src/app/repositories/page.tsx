"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import {
  FolderGit2,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
  Plus,
  Lock,
  Globe,
  AlertTriangle,
  History,
} from "lucide-react";
import { ShellLayout } from "@/components/layout/ShellLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { StatusBadge, VisibilityBadge } from "@/components/shared/StatusBadge";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { ManagedRepositoryResponse, WorkflowRunResponse } from "@/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<ManagedRepositoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [selectedRepoForDelete, setSelectedRepoForDelete] = useState<ManagedRepositoryResponse | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const data = await api.listRepositories();
      setRepositories(data);
    } catch (err) {
      console.error("Failed to load managed repositories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepositories();
  }, []);

  const handleOpenDeleteModal = (repo: ManagedRepositoryResponse) => {
    setSelectedRepoForDelete(repo);
    setDeleteModalOpen(true);
  };

  const handleDeletionSuccess = (result: WorkflowRunResponse) => {
    // Reload repositories list
    loadRepositories();
  };

  const filtered = repositories.filter((repo) => {
    const matchesSearch =
      repo.repository_name.toLowerCase().includes(search.toLowerCase()) ||
      repo.repository_full_name.toLowerCase().includes(search.toLowerCase()) ||
      repo.github_repository_id.toString().includes(search);

    const matchesStatus =
      statusFilter === "ALL" ? true : repo.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = repositories.filter((r) => r.status === "ACTIVE").length;
  const deletedCount = repositories.filter((r) => r.status === "DELETED").length;

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <FolderGit2 className="h-7 w-7 text-primary" />
              <span>Managed Repositories</span>
            </h1>
            <p className="text-sm font-medium text-foreground-muted">
              Inspect repositories provisioned and governed by this GitAuto instance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadRepositories}
              disabled={loading}
              title="Refresh repository registry"
              className="h-10 px-4 text-xs font-bold"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <NextLink href="/automations/new">
              <Button size="sm" variant="primary" className="h-10 px-4 text-xs font-bold shadow-sm gap-2">
                <Plus className="h-4 w-4" />
                <span>New Repository</span>
              </Button>
            </NextLink>
          </div>
        </div>

        {/* Stats summary banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-card/70 border-border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-foreground-muted">Active Repositories</p>
                <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">{activeCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <FolderGit2 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-card/70 border-border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-foreground-muted">Safely Cleaned</p>
                <p className="text-2xl font-extrabold font-mono text-amber-400 mt-1">{deletedCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                <Trash2 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-card/70 border-border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-foreground-muted">Total Tracked</p>
                <p className="text-2xl font-extrabold font-mono text-foreground mt-1">{repositories.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted text-foreground-muted">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Repositories Table Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-foreground-muted" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by repo name or ID..."
                  className="pl-9 h-10 text-sm font-mono bg-background"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {["ALL", "ACTIVE", "DELETED"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      statusFilter === tab
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-foreground-muted hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title={search ? "No repositories match your filter" : "No managed repositories found"}
                description={
                  search
                    ? "Try adjusting your search keywords or active status filter."
                    : "Create a new automation workflow to provision your first repository."
                }
                actionLabel={search ? "Clear Search" : "Create Automation"}
                onAction={() => (search ? setSearch("") : (window.location.href = "/automations/new"))}
                className="my-8 border-0 bg-transparent"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repository / Full Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">GitHub ID</TableHead>
                    <TableHead className="hidden lg:table-cell">Default Branch</TableHead>
                    <TableHead className="hidden sm:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((repo) => (
                    <TableRow key={repo.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold font-mono text-foreground">
                              {repo.repository_name}
                            </span>
                            <VisibilityBadge visibility={repo.visibility} />
                            {repo.status === "ACTIVE" && (
                              <a
                                href={`https://github.com/${repo.repository_full_name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open on GitHub"
                                className="text-foreground-muted hover:text-foreground transition-colors p-0.5"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          <span className="text-xs text-foreground-muted font-mono font-medium truncate">
                            {repo.repository_full_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={repo.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-mono font-bold text-foreground-muted">
                        {repo.github_repository_id}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs font-mono font-bold text-foreground-muted">
                        {repo.default_branch}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs font-medium text-foreground-muted">
                        {formatDate(repo.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {repo.status === "ACTIVE" || repo.status === "PARTIAL_FAILURE" ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenDeleteModal(repo)}
                            className="h-7 px-2.5 text-xs gap-1 shadow-xs font-mono"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </Button>
                        ) : (
                          <span className="text-[11px] font-mono text-foreground-subtle">
                            Cleaned {formatRelativeTime(repo.remote_deleted_at)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Safe Deletion Modal */}
        <ConfirmDeleteModal
          repo={selectedRepoForDelete}
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          onSuccess={handleDeletionSuccess}
        />
      </div>
    </ShellLayout>
  );
}
