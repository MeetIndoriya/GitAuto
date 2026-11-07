import React from "react";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, Slash, Lock, Globe } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const norm = status.toUpperCase();

  if (norm === "RUNNING_FOREVER" || norm === "RUNNING FOREVER") {
    return (
      <Badge variant="success" className="gap-1.5 font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        RUNNING FOREVER
      </Badge>
    );
  }

  if (norm === "SUCCESS" || norm === "ACTIVE") {
    return (
      <Badge variant="success" className="gap-1.5 font-mono font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {norm}
      </Badge>
    );
  }

  if (norm === "FAILED" || norm === "DELETED") {
    return (
      <Badge variant="destructive" className="gap-1.5 font-mono font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        {norm}
      </Badge>
    );
  }

  if (norm === "PARTIAL_FAILURE" || norm === "WARNING") {
    return (
      <Badge variant="warning" className="gap-1.5 font-mono font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        {norm === "PARTIAL_FAILURE" ? "PARTIAL" : norm}
      </Badge>
    );
  }

  if (norm === "IN_PROGRESS") {
    return (
      <Badge variant="info" className="gap-1.5 font-mono font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
        RUNNING
      </Badge>
    );
  }

  if (norm === "DELETED_EXTERNALLY") {
    return (
      <Badge variant="outline" className="gap-1.5 font-mono font-medium text-foreground-muted">
        <Slash className="h-3 w-3" />
        EXTERNAL 404
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5 font-mono font-medium">
      <Clock className="h-3 w-3" />
      {norm}
    </Badge>
  );
}

export function VisibilityBadge({ visibility }: { visibility: "public" | "private" | string }) {
  const isPrivate = visibility.toLowerCase() === "private";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono text-foreground-muted">
      {isPrivate ? <Lock className="h-3 w-3 text-amber-400/80" /> : <Globe className="h-3 w-3 text-sky-400/80" />}
      <span className="capitalize">{visibility}</span>
    </span>
  );
}
