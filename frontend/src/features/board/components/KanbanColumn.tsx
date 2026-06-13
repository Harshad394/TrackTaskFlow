"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";
import { BoardSection, BoardTask } from "../types";
import { getId, sectionLabel, sortByOrder } from "../utils";
import { SectionActionsMenu } from "./SectionActionsMenu";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  section: BoardSection;
  tasks: BoardTask[];
  /** Whether the current user may create tasks (ADMIN, DEVELOPER) */
  canCreateTask?: boolean;
  /** Whether the current user may drag-move tasks (ADMIN, DEVELOPER, QA) */
  canMoveTask?: boolean;
  /** Whether the current user may rename/delete sections (ADMIN only) */
  canManageSection?: boolean;
  /** Required when canManageSection is true */
  projectId?: string;
  /** Whether board-level filters are currently active */
  isFiltered?: boolean;
  onCreateTask: (section: BoardSection) => void;
  onOpenTask: (task: BoardTask) => void;
}

export function KanbanColumn({
  section,
  tasks,
  canCreateTask = false,
  canMoveTask = false,
  canManageSection = false,
  projectId,
  isFiltered = false,
  onCreateTask,
  onOpenTask,
}: KanbanColumnProps) {
  const sectionId = getId(section);
  const { setNodeRef, isOver } = useDroppable({
    id: `section:${sectionId}`,
    data: { type: "section", sectionId, index: sortByOrder(tasks).length },
  });
  const sortedTasks = sortByOrder(tasks);

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[28rem] w-[20rem] shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/70",
        isOver && "border-blue-400 bg-blue-50/60 dark:bg-blue-950/20"
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-3 dark:border-slate-800">
        {/* Section name + task count — shrinks when actions menu is visible */}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {sectionLabel(section)}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sortedTasks.length} {sortedTasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>

        {/* ADMIN section controls — rename + delete */}
        {canManageSection && projectId && (
          <SectionActionsMenu
            section={section}
            projectId={projectId}
            taskCount={sortedTasks.length}
          />
        )}

        {/* Column-level "+" — ADMIN / DEVELOPER */}
        {canCreateTask && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => onCreateTask(section)}
            title="Create task in this section"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Task list */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {sortedTasks.length === 0 ? (
          <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {isFiltered
              ? "No matches"
              : canMoveTask
              ? "Drop tasks here"
              : "No tasks yet"}
          </div>
        ) : (
          sortedTasks.map((task, index) => (
            <TaskCard
              key={getId(task)}
              task={task}
              sectionId={sectionId}
              index={index}
              canMove={canMoveTask}
              onOpen={onOpenTask}
            />
          ))
        )}
      </div>
    </section>
  );
}
