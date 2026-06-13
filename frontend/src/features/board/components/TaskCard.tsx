"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Bug, CircleDot, Sparkles } from "lucide-react";
import { cn } from "../../../lib/utils";
import { BoardTask } from "../types";
import { getId, getUserName } from "../utils";
import { ApprovalStatusBadge } from "./ApprovalPanel";

const priorityStyles = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  medium:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900",
  high: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  urgent:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
};

const typeIcon = {
  task: CircleDot,
  bug: Bug,
  feature: Sparkles,
};

interface TaskCardProps {
  task: BoardTask;
  sectionId: string;
  index: number;
  /** Whether the current user may drag this card (ADMIN, DEVELOPER, QA) */
  canMove?: boolean;
  onOpen: (task: BoardTask) => void;
}

export function TaskCard({
  task,
  sectionId,
  index,
  canMove = false,
  onOpen,
}: TaskCardProps) {
  const taskId = getId(task);

  const droppable = useDroppable({
    id: `task:${taskId}`,
    data: { type: "task", taskId, sectionId, index },
    disabled: !canMove,
  });

  const draggable = useDraggable({
    id: taskId,
    data: { task, sectionId, index },
    disabled: !canMove,
  });

  const TypeIcon = typeIcon[task.type || "task"];
  const transform = CSS.Translate.toString(draggable.transform);
  const approvalStatus = task.approvalStatus;
  const showBadge =
    approvalStatus === "PENDING" ||
    approvalStatus === "APPROVED" ||
    approvalStatus === "REJECTED";

  return (
    <button
      ref={(node) => {
        draggable.setNodeRef(node);
        droppable.setNodeRef(node);
      }}
      type="button"
      style={{ transform }}
      {...(canMove ? draggable.listeners : {})}
      {...(canMove ? draggable.attributes : {})}
      onClick={() => {
        if (!draggable.isDragging) onOpen(task);
      }}
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950",
        draggable.isDragging && "z-20 opacity-60 ring-2 ring-blue-500",
        droppable.isOver && "border-blue-400",
        !canMove && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
          {task.title}
        </h3>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[11px] font-medium capitalize",
            priorityStyles[task.priority || "medium"]
          )}
        >
          {task.priority || "medium"}
        </span>
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(task.labels || []).slice(0, 3).map((label) => (
          <span
            key={label}
            className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1 capitalize">
          <TypeIcon className="h-3.5 w-3.5" />
          {task.type || "task"}
        </span>
        <span className="max-w-[8rem] truncate">{getUserName(task.assignee)}</span>
      </div>

      {showBadge && (
        <div className="mt-2">
          <ApprovalStatusBadge status={approvalStatus} />
        </div>
      )}
    </button>
  );
}
