"use client";

import {
  CheckCircle2,
  Clock,
  FileEdit,
  MessageSquare,
  MoveRight,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Timer,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { ActivityAction, ActivityEntry, ActivityUser } from "../types";
import { useTaskActivity } from "../hooks/useTaskActivity";

// ── Metadata for each action type ───────────────────────────────────────────

const ACTION_META: Record<
  ActivityAction,
  { label: string; icon: React.ElementType; color: string }
> = {
  created: {
    label: "Created task",
    icon: Plus,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  },
  updated: {
    label: "Updated task",
    icon: FileEdit,
    color:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  moved: {
    label: "Moved task",
    icon: MoveRight,
    color:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
  },
  commented: {
    label: "Added a comment",
    icon: MessageSquare,
    color:
      "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
  },
  time_logged: {
    label: "Logged time",
    icon: Timer,
    color:
      "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400",
  },
  deleted: {
    label: "Deleted task",
    icon: Trash2,
    color: "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
  },
  approval_requested: {
    label: "Requested approval",
    icon: Clock,
    color:
      "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  },
  approved: {
    label: "Approved task",
    icon: ThumbsUp,
    color:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected task",
    icon: ThumbsDown,
    color: "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const getActorName = (user: ActivityEntry["user"]): string => {
  if (typeof user === "string") return "Someone";
  const u = user as ActivityUser;
  return u.name || u.email || "Unknown user";
};

const formatTimestamp = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

// ── Single activity row ──────────────────────────────────────────────────────

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const meta = ACTION_META[entry.action] ?? ACTION_META.updated;
  const Icon = meta.icon;

  return (
    <div className="flex gap-3">
      {/* Icon dot */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
            meta.color
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        {/* Connector line — drawn from CSS via a pseudo-element substitute */}
        <div className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Content */}
      <div className="min-w-0 pb-4">
        <p className="text-sm leading-6 text-slate-900 dark:text-slate-100">
          <span className="font-semibold">{getActorName(entry.user)}</span>{" "}
          <span className="text-slate-600 dark:text-slate-300">
            {meta.label.toLowerCase()}
          </span>
        </p>

        {entry.details && (
          <p className="mt-0.5 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            {entry.details}
          </p>
        )}

        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {formatTimestamp(entry.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface TaskActivityLogProps {
  taskId: string;
  /** Only fetch when the drawer is actually open */
  enabled?: boolean;
}

export function TaskActivityLog({ taskId, enabled = true }: TaskActivityLogProps) {
  const { data, isLoading, isError } = useTaskActivity(taskId, enabled);
  const activities = data?.activities ?? [];

  return (
    <section className="border-t border-slate-200 p-5 dark:border-slate-800">
      {/* Section header */}
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <CheckCircle2 className="h-4 w-4 text-slate-400" />
          Activity
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Full history of changes, comments, and actions.
        </p>
      </div>

      {/* Content states */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-rose-500">Could not load activity.</p>
      ) : activities.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No activity yet.
        </div>
      ) : (
        <div className="relative">
          {activities.map((entry) => (
            <ActivityRow key={entry._id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
