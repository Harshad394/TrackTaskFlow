"use client";

import {
  CheckCircle2,
  Clock4,
  SendHorizonal,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";
import { BoardTask } from "../types";
import { getId } from "../utils";
import { useApprovalActions } from "../hooks/useApprovalActions";

type ApprovalStatus = NonNullable<BoardTask["approvalStatus"]>;

/* ── Status badge ──────────────────────────────────────────────────────────── */

const STATUS_META: Record<
  ApprovalStatus,
  { label: string; icon: React.ElementType; cls: string; bg: string }
> = {
  NOT_REQUIRED: {
    label: "Not required",
    icon: Clock4,
    cls: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
  },
  PENDING: {
    label: "Pending review",
    icon: Clock4,
    cls: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    cls: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    cls: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
  },
};

export function ApprovalStatusBadge({ status }: { status?: ApprovalStatus }) {
  const key = status ?? "NOT_REQUIRED";
  const { label, icon: Icon, cls, bg } = STATUS_META[key];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        bg,
        cls
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/* ── Reject form (inline) ─────────────────────────────────────────────────── */

function RejectForm({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="mt-3 space-y-2">
      <textarea
        className="min-h-20 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-rose-400 dark:border-slate-700 dark:text-slate-100"
        placeholder="Explain why this task is being rejected…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="danger"
          isLoading={isLoading}
          disabled={!reason.trim()}
          onClick={() => onConfirm(reason.trim())}
        >
          <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
          Confirm reject
        </Button>
      </div>
    </div>
  );
}

/* ── Main panel ────────────────────────────────────────────────────────────── */

interface ApprovalPanelProps {
  task: BoardTask;
  projectId: string;
  /** ADMIN, DEVELOPER, QA: can send to review */
  canRequestApproval: boolean;
  /** CLIENT + ADMIN: can approve / reject */
  canApproveReject: boolean;
  /** Called after any action resolves so the drawer can update its local task */
  onTaskUpdated: (updated: BoardTask) => void;
}

export function ApprovalPanel({
  task,
  projectId,
  canRequestApproval,
  canApproveReject,
  onTaskUpdated,
}: ApprovalPanelProps) {
  const taskId = getId(task);
  const status = task.approvalStatus ?? "NOT_REQUIRED";
  const actions = useApprovalActions(projectId);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleRequestApproval = () => {
    actions.requestApproval.mutate(
      { taskId },
      { onSuccess: onTaskUpdated }
    );
  };

  const handleApprove = () => {
    actions.approve.mutate(
      { taskId },
      { onSuccess: onTaskUpdated }
    );
  };

  const handleReject = (reason: string) => {
    actions.reject.mutate(
      { taskId, rejectionReason: reason },
      {
        onSuccess: (updated) => {
          setShowRejectForm(false);
          onTaskUpdated(updated);
        },
      }
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          Approval
        </span>
        <ApprovalStatusBadge status={status} />
      </div>

      {/* Rejection reason (visible when rejected) */}
      {status === "REJECTED" && task.rejectionReason && (
        <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          <span className="font-semibold">Reason: </span>
          {task.rejectionReason}
        </p>
      )}

      {/* Inline reject form */}
      {showRejectForm && (
        <RejectForm
          onConfirm={handleReject}
          onCancel={() => setShowRejectForm(false)}
          isLoading={actions.reject.isPending}
        />
      )}

      {/* Action buttons */}
      {!showRejectForm && (
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Request approval — ADMIN / DEV / QA, only when not yet pending/approved */}
          {canRequestApproval && (status === "NOT_REQUIRED" || status === "REJECTED") && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              isLoading={actions.requestApproval.isPending}
              onClick={handleRequestApproval}
            >
              <SendHorizonal className="mr-1.5 h-3.5 w-3.5" />
              Request approval
            </Button>
          )}

          {/* Approve — CLIENT + ADMIN, only when PENDING */}
          {canApproveReject && status === "PENDING" && (
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              isLoading={actions.approve.isPending}
              onClick={handleApprove}
            >
              <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
              Approve
            </Button>
          )}

          {/* Reject — CLIENT + ADMIN, only when PENDING */}
          {canApproveReject && status === "PENDING" && (
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => setShowRejectForm(true)}
            >
              <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </Button>
          )}

          {/* ADMIN override: re-open approval for already-approved tasks */}
          {canRequestApproval && canApproveReject && status === "APPROVED" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              isLoading={actions.requestApproval.isPending}
              onClick={handleRequestApproval}
            >
              <SendHorizonal className="mr-1.5 h-3.5 w-3.5" />
              Re-request approval
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
