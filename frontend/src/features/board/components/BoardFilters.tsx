"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useId } from "react";
import { Button } from "../../../components/ui/Button";
import { ProjectMember } from "../../project-members/types";
import { getMemberName, getUserId } from "../../project-members/utils";
import { TaskFilters, TaskPriority, TaskType } from "../types";
import { hasActiveFilters } from "../hooks/useFilteredTasks";

const SELECT_CLS =
  "h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500";

interface BoardFiltersProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  /** Project members — used to populate the assignee dropdown */
  members?: ProjectMember[];
  /** Whether a filtered request is in-flight */
  isLoading?: boolean;
}

export function BoardFilters({
  filters,
  onChange,
  members = [],
  isLoading,
}: BoardFiltersProps) {
  const uid = useId();
  const active = hasActiveFilters(filters);

  const set = useCallback(
    (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch }),
    [filters, onChange]
  );

  const clear = useCallback(
    () =>
      onChange({
        q: undefined,
        priority: undefined,
        type: undefined,
        assignee: undefined,
        section: undefined,
        labels: undefined,
        dueFrom: undefined,
        dueTo: undefined,
      }),
    [onChange]
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {/* ── Row 1: search + priority + type + assignee ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex min-w-[13rem] flex-1 items-center">
          <Search className="pointer-events-none absolute left-2.5 h-4 w-4 text-slate-400" />
          <input
            id={`${uid}-q`}
            type="text"
            placeholder="Search tasks…"
            value={filters.q ?? ""}
            onChange={(e) => set({ q: e.target.value || undefined })}
            className="h-9 w-full rounded-md border border-slate-300 bg-transparent pl-8 pr-3 text-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-slate-100"
          />
          {filters.q && (
            <button
              type="button"
              onClick={() => set({ q: undefined })}
              className="absolute right-2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Priority */}
        <select
          id={`${uid}-priority`}
          className={SELECT_CLS}
          value={filters.priority ?? ""}
          onChange={(e) =>
            set({ priority: (e.target.value as TaskPriority) || undefined })
          }
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        {/* Type */}
        <select
          id={`${uid}-type`}
          className={SELECT_CLS}
          value={filters.type ?? ""}
          onChange={(e) =>
            set({ type: (e.target.value as TaskType) || undefined })
          }
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          <option value="task">Task</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
        </select>

        {/* Assignee */}
        {members.length > 0 && (
          <select
            id={`${uid}-assignee`}
            className={SELECT_CLS}
            value={filters.assignee ?? ""}
            onChange={(e) => set({ assignee: e.target.value || undefined })}
            aria-label="Filter by assignee"
          >
            <option value="">All assignees</option>
            {members.map((m) => {
              const id = getUserId(m.userId);
              return (
                <option key={id} value={id}>
                  {getMemberName(m)}
                </option>
              );
            })}
          </select>
        )}

        {/* ── Right side: label filter + due date + clear ── */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Label text */}
          <div className="relative flex items-center">
            <SlidersHorizontal className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              id={`${uid}-labels`}
              type="text"
              placeholder="Label…"
              value={filters.labels ?? ""}
              onChange={(e) => set({ labels: e.target.value || undefined })}
              className="h-9 w-28 rounded-md border border-slate-300 bg-transparent pl-7 pr-2 text-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-slate-100"
              aria-label="Filter by label"
            />
          </div>

          {/* Due from */}
          <input
            id={`${uid}-dueFrom`}
            type="date"
            title="Due from"
            value={filters.dueFrom ?? ""}
            onChange={(e) => set({ dueFrom: e.target.value || undefined })}
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Due date from"
          />

          {/* Due to */}
          <input
            id={`${uid}-dueTo`}
            type="date"
            title="Due to"
            value={filters.dueTo ?? ""}
            onChange={(e) => set({ dueTo: e.target.value || undefined })}
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Due date to"
          />

          {/* Clear — only visible when something is active */}
          {active && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clear}
              className="gap-1 text-rose-600 hover:text-rose-700 dark:text-rose-400"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active filter count badge */}
      {active && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {isLoading ? (
            <span className="animate-pulse">Searching…</span>
          ) : (
            <span>
              Filters active — showing matching tasks across all sections.
            </span>
          )}
        </p>
      )}
    </div>
  );
}
