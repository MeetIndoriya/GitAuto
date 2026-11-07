"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ManagedRepositoryResponse, WorkflowRunResponse } from "@/types";
import { AlertTriangle, Trash2, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";

export interface ConfirmDeleteModalProps {
  repo: ManagedRepositoryResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: WorkflowRunResponse) => void;
}

export function ConfirmDeleteModal({ repo, open, onOpenChange, onSuccess }: ConfirmDeleteModalProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  if (!repo) return null;

  const isMatch = confirmInput.trim() === repo.repository_name;

  const handleDelete = async () => {
    if (!isMatch || isDeleting) return;
    try {
      setIsDeleting(true);
      const result = await api.deleteRepository(repo.id, confirmInput.trim());
      toast.success("Repository deleted successfully", `Deleted '${repo.repository_name}' on GitHub.`);
      onOpenChange(false);
      setConfirmInput("");
      onSuccess(result);
    } catch (err: any) {
      toast.error("Failed to delete repository", err.message || "An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
      <DialogContent onClose={() => !isDeleting && onOpenChange(false)} className="border-red-500/30">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-red-400 mb-1">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base text-red-400">Confirm Destructive Repository Deletion</DialogTitle>
          </div>
          <DialogDescription>
            You are about to delete <strong className="text-foreground font-mono font-semibold">{repo.repository_full_name}</strong> on GitHub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Warning box */}
          <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-300 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Safety Interlock Active</span>
            </div>
            <p>
              This operation triggers a remote GitHub API deletion. All code, branches, and issues in this repository will be permanently deleted.
            </p>
            <p className="text-foreground-muted">
              GitAuto will preserve all execution logs and audit history in its local database.
            </p>
          </div>

          {/* Repo metadata pill */}
          <div className="p-3 rounded-lg border border-border bg-muted/40 text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-foreground-muted">GitHub Repo ID:</span>
              <span className="text-foreground font-medium">{repo.github_repository_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-muted">Visibility:</span>
              <span className="text-foreground font-medium capitalize">{repo.visibility}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-muted">Default Branch:</span>
              <span className="text-foreground font-medium">{repo.default_branch}</span>
            </div>
          </div>

          {/* Type confirmation input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              To confirm, type <span className="font-mono font-bold text-red-400 select-all">{repo.repository_name}</span> below:
            </label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={repo.repository_name}
              disabled={isDeleting}
              className="font-mono text-sm bg-background border-border-focus"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isMatch || isDeleting}
            isLoading={isDeleting}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            <span>Permanently Delete</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
