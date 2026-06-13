"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Link from "next/link";
import {
  BarChart3,
  Clock,
  Columns3,
  Plus,
  RefreshCcw,
  Settings,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "../../../components/ui/Button";
import { BoardSection, BoardTask, TaskFilters } from "../types";
import { getId, getTaskSectionId } from "../utils";
import { useBoard } from "../hooks/useBoard";
import { useBoardPermissions } from "../hooks/useBoardPermissions";
import { useCreateTask } from "../hooks/useCreateTask";
import { useFilteredTasks, hasActiveFilters } from "../hooks/useFilteredTasks";
import { useMoveTask } from "../hooks/useMoveTask";
import { useUpdateTask } from "../hooks/useUpdateTask";
import { useCreateSection } from "../hooks/useSectionMutations";
import { BoardFilters } from "./BoardFilters";
import { CreateTaskModal } from "./CreateTaskModal";
import { KanbanColumn } from "./KanbanColumn";
import { TaskDetailsDrawer } from "./TaskDetailsDrawer";

interface KanbanBoardProps {
  projectId: string;
}

const EMPTY_FILTERS: TaskFilters = {};

// ── Add-section inline form ───────────────────────────────────────────────────
function AddSectionColumn({
  projectId,
  onDone,
}: {
  projectId: string;
  onDone: () => void;
}) {
  const mutation = useCreateSection(projectId);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    mutation.mutate(
      { name: trimmed },
      { onSuccess: () => { setName(""); onDone(); } }
    );
  };

  return (
    <div className="flex h-full min-h-[28rem] w-[20rem] shrink-0 flex-col items-stretch justify-start rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-900/40">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <Columns3 className="h-4 w-4 text-slate-400" />
        New section
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          ref={inputRef}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Section name…"
          maxLength={50}
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            className="flex-1"
            isLoading={mutation.isPending}
            disabled={name.trim().length < 2}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
        {mutation.isError && (
          <p className="text-xs text-rose-500">
            {(mutation.error as any)?.response?.data?.message ||
              "Could not create section."}
          </p>
        )}
      </form>
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────
export function KanbanBoard({ projectId }: KanbanBoardProps) {
  // ── Data ─────────────────────────────────────────────────────────────────
  const {
    data: boardData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useBoard(projectId);
  const createTaskMutation = useCreateTask(projectId);
  const moveTaskMutation = useMoveTask(projectId);
  const updateTaskMutation = useUpdateTask(projectId);

  // ── Permissions ───────────────────────────────────────────────────────────
  const perms = useBoardPermissions(projectId);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const filtersActive = hasActiveFilters(filters);
  const filteredQuery = useFilteredTasks(projectId, filters);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [createSection, setCreateSection] = useState<BoardSection | null>(null);
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);

  const searchParams = useSearchParams();

  // Pre-open task from query params (?taskId=xxx)
  useEffect(() => {
    const taskIdParam = searchParams?.get("taskId");
    if (!taskIdParam || !boardData?.board) return;

    for (const section of boardData.board) {
      const task = section.tasks?.find((t: any) => getId(t) === taskIdParam);
      if (task) {
        setSelectedTask(task);
        break;
      }
    }
  }, [boardData, searchParams]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(() => {
    const allColumns = boardData?.board ?? [];
    if (!filtersActive) return allColumns;

    const filteredTasks = filteredQuery.data?.tasks ?? [];
    const bySection = new Map<string, BoardTask[]>();
    for (const task of filteredTasks) {
      const sid = getTaskSectionId(task);
      if (!bySection.has(sid)) bySection.set(sid, []);
      bySection.get(sid)!.push(task);
    }

    return allColumns.map((col) => ({
      section: col.section,
      tasks: bySection.get(getId(col.section)) ?? [],
    }));
  }, [boardData?.board, filtersActive, filteredQuery.data?.tasks]);

  const firstSection = columns[0]?.section ?? null;

  // ── Drag end ──────────────────────────────────────────────────────────────
  const handleDragEnd = (event: DragEndEvent) => {
    if (!perms.canMoveTask) return;

    const { active, over } = event;
    if (!over) return;

    const activeTask = active.data.current?.task as BoardTask | undefined;
    if (!activeTask) return;

    const targetSectionId = over.data.current?.sectionId as string | undefined;
    const targetOrder = over.data.current?.index as number | undefined;
    if (!targetSectionId || targetOrder === undefined) return;

    const currentSectionId = active.data.current?.sectionId as
      | string
      | undefined;
    const currentIndex = active.data.current?.index as number | undefined;
    const taskId = getId(activeTask);

    if (currentSectionId === targetSectionId && currentIndex === targetOrder)
      return;

    moveTaskMutation.mutate({
      taskId,
      data: { section: targetSectionId, order: targetOrder },
    });
  };

  // ── Loading / error ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
        Board could not be loaded.
        <Button
          className="ml-3"
          size="sm"
          variant="outline"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Project board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {perms.isClient
              ? "View tasks and leave feedback for the team."
              : "Move work across sections and keep task details current."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/projects/${projectId}/backlog`}
            className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Columns3 className="mr-2 h-4 w-4" />
            Backlog
          </Link>

          {perms.canViewAnalytics && (
            <Link
              href={`/projects/${projectId}/analytics`}
              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          )}

          {perms.canManageMembers && (
            <Link
              href={`/projects/${projectId}/settings`}
              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Settings className="mr-2 h-4 w-4" />
              Members
            </Link>
          )}

          {perms.canViewTimeLogs && (
            <Link
              href={`/projects/${projectId}/time-logs`}
              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Clock className="mr-2 h-4 w-4" />
              Time report
            </Link>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          {/* Add section — ADMIN only */}
          {perms.canManageSection && !showAddSection && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddSection(true)}
            >
              <Columns3 className="mr-2 h-4 w-4" />
              Add section
            </Button>
          )}

          {perms.canCreateTask && (
            <Button
              size="sm"
              onClick={() => firstSection && setCreateSection(firstSection)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New task
            </Button>
          )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <BoardFilters
        filters={filters}
        onChange={setFilters}
        members={perms.projectMembers}
        isLoading={filteredQuery.isFetching}
      />

      {/* ── Board ──────────────────────────────────────────────────────── */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex min-h-[30rem] gap-4">
            {columns.map((column) => (
              <KanbanColumn
                key={getId(column.section)}
                section={column.section}
                tasks={column.tasks}
                canCreateTask={perms.canCreateTask}
                canMoveTask={perms.canMoveTask}
                canManageSection={perms.canManageSection}
                projectId={projectId}
                isFiltered={filtersActive}
                onCreateTask={setCreateSection}
                onOpenTask={setSelectedTask}
              />
            ))}

            {/* Add-section ghost column (ADMIN only, while form is open) */}
            {perms.canManageSection && showAddSection && (
              <AddSectionColumn
                projectId={projectId}
                onDone={() => setShowAddSection(false)}
              />
            )}
          </div>
        </div>
      </DndContext>

      {columns.length === 0 && !showAddSection && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No sections found.{" "}
          {perms.canManageSection && (
            <button
              type="button"
              className="ml-1 text-blue-600 underline hover:text-blue-700"
              onClick={() => setShowAddSection(true)}
            >
              Create the first section
            </button>
          )}
        </div>
      )}

      {/* Filtered, no results */}
      {filtersActive &&
        !filteredQuery.isFetching &&
        (filteredQuery.data?.tasks.length ?? 0) === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No tasks match the current filters.
          </div>
        )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <CreateTaskModal
        isOpen={Boolean(createSection)}
        section={createSection}
        isLoading={createTaskMutation.isPending}
        projectMembers={perms.projectMembers}
        currentUserRole={perms.role}
        currentUserId={perms.currentUserId}
        onClose={() => setCreateSection(null)}
        onSubmit={(payload) => {
          if (!createSection) return;
          createTaskMutation.mutate(
            { sectionId: getId(createSection), data: payload },
            { onSuccess: () => setCreateSection(null) }
          );
        }}
      />

      <TaskDetailsDrawer
        isOpen={Boolean(selectedTask)}
        task={selectedTask}
        isSaving={updateTaskMutation.isPending}
        projectId={projectId}
        projectMembers={perms.projectMembers}
        currentUserRole={perms.role}
        currentUserId={perms.currentUserId}
        canEdit={perms.canEditTask}
        canRequestApproval={perms.canRequestApproval}
        canApproveReject={perms.canApproveReject}
        canAddAttachment={perms.canAddAttachment}
        canDeleteAnyAttachment={perms.canDeleteAnyAttachment}
        onClose={() => setSelectedTask(null)}
        onSave={(taskId, payload) => {
          updateTaskMutation.mutate(
            { taskId, data: payload },
            { onSuccess: (updatedTask) => setSelectedTask(updatedTask) }
          );
        }}
      />
    </div>
  );
}
