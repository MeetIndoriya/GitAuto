"use client";

import React, { useEffect, useState, useCallback } from "react";
import NextLink from "next/link";
import {
  History,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  Layers,
  X,
} from "lucide-react";
import { ShellLayout } from "@/components/layout/ShellLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { api } from "@/lib/api";
import { HistoryItemResponse, PaginationMeta } from "@/types";
import { formatDate, formatDuration, formatRelativeTime } from "@/lib/utils";

export default function HistoryPage() {
  const toast = useToast();
  const [items, setItems] = useState<HistoryItemResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [opTypeFilter, setOpTypeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isExporting, setIsExporting] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.listHistory({
        search: search.trim() || undefined,
        status: statusFilter,
        operation_type: opTypeFilter,
        sort_by: sortBy,
        page: currentPage,
        page_size: pageSize,
      });
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error("Failed to load history", err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, opTypeFilter, sortBy, currentPage, pageSize, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExportJson = async () => {
    try {
      setIsExporting(true);
      const data = await api.exportHistory();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gitauto-audit-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Audit log exported", `Exported ${data.length} execution records as JSON.`);
    } catch (err: any) {
      toast.error("Export failed", err.message || "Could not export history");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setOpTypeFilter("ALL");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const hasActiveFilters = search || statusFilter !== "ALL" || opTypeFilter !== "ALL" || sortBy !== "newest";

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <History className="h-7 w-7 text-primary" />
              <span>Execution History & Audit</span>
            </h1>
            <p className="text-sm font-medium text-foreground-muted">
              Complete historical timeline of all repository creations, teardowns, and step logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              disabled={isExporting || items.length === 0}
              className="h-10 px-4 text-xs font-bold gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Export JSON</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              disabled={loading}
              title="Refresh History"
              className="h-10 px-3.5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Filter Controls Card */}
        <Card className="bg-card/70 border-border">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search Bar (5 cols) */}
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-subtle" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search repository name or execution ID..."
                  className="pl-9 h-9 text-xs font-mono bg-background"
                />
              </div>

              {/* Status Filter (3 cols) */}
              <div className="md:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="PARTIAL_FAILURE">PARTIAL FAILURE</option>
                  <option value="FAILED">FAILED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                </select>
              </div>

              {/* Operation Type (2 cols) */}
              <div className="md:col-span-2">
                <select
                  value={opTypeFilter}
                  onChange={(e) => {
                    setOpTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono"
                >
                  <option value="ALL">All Workflows</option>
                  <option value="CREATE_REPOSITORY">Creation</option>
                  <option value="DELETE_REPOSITORY">Deletion</option>
                </select>
              </div>

              {/* Sort Order (2 cols) */}
              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                <span className="text-foreground-muted">
                  Found <strong className="text-foreground font-mono">{pagination.total_items}</strong> matching execution records
                </span>
                <button
                  onClick={handleClearFilters}
                  className="text-foreground-subtle hover:text-foreground inline-flex items-center gap-1 font-mono hover:underline"
                >
                  <X className="h-3 w-3" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Table Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                title="No execution logs found"
                description={
                  hasActiveFilters
                    ? "Try loosening your search terms or clearing status filters."
                    : "No automation runs recorded yet. Execute a workflow to generate logs."
                }
                actionLabel={hasActiveFilters ? "Reset Filters" : "Run Automation"}
                onAction={hasActiveFilters ? handleClearFilters : () => (window.location.href = "/automations/new")}
                className="my-8 border-0 bg-transparent"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Execution ID</TableHead>
                    <TableHead>Target Repository</TableHead>
                    <TableHead>Workflow Operation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Duration</TableHead>
                    <TableHead className="hidden md:table-cell">Steps</TableHead>
                    <TableHead className="text-right">Executed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => (window.location.href = `/history/${item.id}`)}
                    >
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        <span className="text-primary hover:underline">{item.id.slice(0, 8)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-foreground">
                          <span>{item.repository_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-foreground-muted font-mono">
                        {item.operation_type === "CREATE_REPOSITORY" ? "Creation & Init" : "Safe Teardown"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs font-mono text-foreground-muted">
                        {formatDuration(item.duration_ms)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-mono text-foreground-muted">
                        {item.successful_step_count} / {item.step_count}
                      </TableCell>
                      <TableCell className="text-right text-xs text-foreground-muted">
                        {formatDate(item.started_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination Bar */}
        {pagination.total_pages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground-muted px-1">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded border border-input bg-background px-2 text-xs font-mono text-foreground"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-foreground-subtle ml-2">
                Page <strong className="text-foreground">{pagination.page}</strong> of{" "}
                <strong className="text-foreground">{pagination.total_pages}</strong> ({pagination.total_items} items)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.has_prev}
                className="h-8 gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!pagination.has_next}
                className="h-8 gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
