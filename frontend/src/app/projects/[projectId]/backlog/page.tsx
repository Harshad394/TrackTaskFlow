"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  RefreshCcw,
  Sparkles,
  Bug,
  CircleDot,
  Minus,
  CheckCircle,
  Play,
  Check,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "../../../../components/layout/AppShell";
import { Button } from "../../../../components/ui/Button";
import { cn } from "../../../../lib/utils";
import { useBoardPermissions } from "../../../../features/board/hooks/useBoardPermissions";
import { getProjectTasks } from "../../../../features/board/api";
import { useBacklog } from "../../../../features/sprints/hooks/useBacklog";
import { useSprints } from "../../../../features/sprints/hooks/useSprints";
import { CreateSprintModal } from "../../../../features/sprints/components/CreateSprintModal";
import {
  useAddTaskToSprint,
  useRemoveTaskFromSprint,
  useUpdateSprint,
} from "../../../../features/sprints/hooks/useSprintMutations";
import { Sprint } from "../../../../features/sprints/types";

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

export default function ProjectBacklogPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId || "";

  // ── Permissions ───────────────────────────────────────────────────────────
  const perms = useBoardPermissions(projectId);
  const canManageSprints =
    perms.role === "ADMIN" || perms.role === "DEVELOPER" || perms.role === "QA";

  // ── Query States ──────────────────────────────────────────────────────────
  const {
    data: backlogData,
    isLoading: isLoadingBacklog,
    refetch: refetchBacklog,
    isFetching: isFetchingBacklog,
  } = useBacklog(projectId);

  const {
    data: sprintsData,
    isLoading: isLoadingSprints,
    refetch: refetchSprints,
    isFetching: isFetchingSprints,
  } = useSprints(projectId);

  // Fetch all project tasks to associate tasks with their respective sprints
  const {
    data: allTasksData,
    isLoading: isLoadingTasks,
    refetch: refetchTasks,
    isFetching: isFetchingTasks,
  } = useQuery({
    queryKey: ["project-tasks-all", projectId],
    queryFn: () => getProjectTasks(projectId, {}),
    enabled: Boolean(projectId),
  });

  // ── Mutation Hooks ────────────────────────────────────────────────────────
  const addTaskMutation = useAddTaskToSprint(projectId);
  const removeTaskMutation = useRemoveTaskFromSprint(projectId);
  const updateSprintMutation = useUpdateSprint(projectId);

  // ── UI State ──────────────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addingTaskToSprintId, setAddingTaskToSprintId] = useState<Record<string, string>>({});

  // ── Helpers ───────────────────────────────────────────────────────────────
  const sprints = useMemo(() => sprintsData?.sprints || [], [sprintsData]);
  const backlogTasks = useMemo(() => backlogData?.tasks || [], [backlogData]);
  const allTasks = useMemo(() => allTasksData?.tasks || [], [allTasksData]);

  // Group tasks by sprint ID
  const sprintTasksMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const task of allTasks) {
      if (task.sprint) {
        const sprintId = typeof task.sprint === "string" ? task.sprint : task.sprint._id || task.sprint.id;
        if (sprintId) {
          if (!map.has(sprintId)) map.set(sprintId, []);
          map.get(sprintId)?.push(task);
        }
      }
    }
    return map;
  }, [allTasks]);

  const activeOrPlannedSprints = useMemo(() => {
    return sprints.filter((s) => s.status !== "COMPLETED");
  }, [sprints]);

  const handleStartSprint = (sprint: Sprint) => {
    setErrorMessage(null);
    updateSprintMutation.mutate(
      {
        sprintId: sprint._id,
        payload: { status: "ACTIVE" },
      },
      {
        onError: (err: any) => {
          setErrorMessage(err?.response?.data?.message || "Failed to start sprint");
        },
      }
    );
  };

  const handleCompleteSprint = (sprint: Sprint) => {
    setErrorMessage(null);
    updateSprintMutation.mutate(
      {
        sprintId: sprint._id,
        payload: { status: "COMPLETED" },
      },
      {
        onError: (err: any) => {
          setErrorMessage(err?.response?.data?.message || "Failed to complete sprint");
        },
      }
    );
  };

  const handleAddTaskToSprintSubmit = (taskId: string, sprintId: string) => {
    if (!sprintId) return;
    setErrorMessage(null);
    addTaskMutation.mutate({ sprintId, taskId });
  };

  const handleRemoveTaskFromSprint = (sprintId: string, taskId: string) => {
    setErrorMessage(null);
    removeTaskMutation.mutate({ sprintId, taskId });
  };

  const refetchAll = () => {
    refetchBacklog();
    refetchSprints();
    refetchTasks();
  };

  const isGlobalLoading =
    isLoadingBacklog || isLoadingSprints || isLoadingTasks || perms.isLoading;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ── Breadcrumb and Header ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <button
              onClick={() => router.push(`/projects/${projectId}/board`)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to board
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Sprint Backlog
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Plan sprints, manage tasks, and prioritize work for the team.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canManageSprints && (
              <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Sprint
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={refetchAll}
              disabled={isFetchingBacklog || isFetchingSprints || isFetchingTasks}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {isGlobalLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="space-y-4 md:col-span-5">
              <div className="h-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-64 animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
            </div>
            <div className="space-y-4 md:col-span-7">
              <div className="h-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-64 animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
            {/* ── Left Column: Backlog Tasks ─────────────────────────────────── */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-slate-500" />
                  Backlog
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {backlogTasks.length}
                  </span>
                </h2>
              </div>

              {backlogTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No backlog tasks. Create tasks on the board to see them here.
                </div>
              ) : (
                <div className="space-y-2 max-h-[36rem] overflow-y-auto pr-1">
                  {backlogTasks.map((task) => {
                    const TypeIcon = typeIcon[task.type as keyof typeof typeIcon] || CircleDot;
                    const pStyle = priorityStyles[task.priority as keyof typeof priorityStyles] || "";
                    const taskId = task._id || task.id;

                    return (
                      <div
                        key={taskId}
                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <TypeIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                {task.type}
                              </span>
                              {task.priority && (
                                <span
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[10px] font-semibold border uppercase",
                                    pStyle
                                  )}
                                >
                                  {task.priority}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                              {task.title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-900 text-xs text-slate-500">
                          <div>
                            {task.assignee ? (
                              <span>Assignee: <span className="font-semibold text-slate-700 dark:text-slate-300">{task.assignee.name || task.assignee.email}</span></span>
                            ) : (
                              <span className="italic">Unassigned</span>
                            )}
                          </div>

                          {canManageSprints && activeOrPlannedSprints.length > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <select
                                className="rounded border border-slate-300 bg-transparent px-1.5 py-1 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:text-slate-100"
                                value={addingTaskToSprintId[taskId] || ""}
                                onChange={(e) =>
                                  setAddingTaskToSprintId((prev) => ({
                                    ...prev,
                                    [taskId]: e.target.value,
                                  }))
                                }
                              >
                                <option value="">Add to Sprint...</option>
                                {activeOrPlannedSprints.map((s) => (
                                  <option key={s._id} value={s._id}>
                                    {s.name} ({s.status})
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 shrink-0"
                                disabled={!addingTaskToSprintId[taskId]}
                                onClick={() =>
                                  handleAddTaskToSprintSubmit(
                                    taskId,
                                    addingTaskToSprintId[taskId]
                                  )
                                }
                              >
                                <Check className="h-3.5 w-3.5 text-blue-600" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Right Column: Sprints ──────────────────────────────────────── */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-slate-500" />
                  Sprints
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {sprints.length}
                  </span>
                </h2>
              </div>

              {sprints.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No sprints created yet. Click "Create Sprint" to start planning.
                </div>
              ) : (
                <div className="space-y-4">
                  {sprints.map((sprint) => {
                    const tasksInSprint = sprintTasksMap.get(sprint._id) || [];
                    const statusColors = {
                      PLANNED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
                      ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
                      COMPLETED: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-900",
                    };

                    return (
                      <div
                        key={sprint._id}
                        className={cn(
                          "rounded-xl border p-4 shadow-sm bg-white dark:bg-slate-950 transition-all",
                          sprint.status === "ACTIVE"
                            ? "border-emerald-300 ring-2 ring-emerald-500/10 dark:border-emerald-800"
                            : "border-slate-200 dark:border-slate-800"
                        )}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between pb-3 border-b border-slate-100 dark:border-slate-900">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                {sprint.name}
                              </h3>
                              <span
                                className={cn(
                                  "rounded px-2 py-0.5 text-[10px] font-bold border",
                                  statusColors[sprint.status]
                                )}
                              >
                                {sprint.status}
                              </span>
                            </div>
                            {sprint.goal && (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Goal:</span> {sprint.goal}
                              </p>
                            )}
                            {(sprint.startDate || sprint.endDate) && (
                              <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : "No start"}
                                  {" - "}
                                  {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : "No end"}
                                </span>
                              </div>
                            )}
                          </div>

                          {canManageSprints && sprint.status !== "COMPLETED" && (
                            <div className="flex gap-2 self-start sm:self-center">
                              {sprint.status === "PLANNED" ? (
                                <Button
                                  size="sm"
                                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleStartSprint(sprint)}
                                >
                                  <Play className="mr-1.5 h-3.5 w-3.5" />
                                  Start
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="h-8"
                                  onClick={() => handleCompleteSprint(sprint)}
                                >
                                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                  Complete
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Tasks list within Sprint */}
                        <div className="mt-3 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                            <span>Tasks ({tasksInSprint.length})</span>
                          </h4>

                          {tasksInSprint.length === 0 ? (
                            <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                              No tasks assigned to this sprint.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {tasksInSprint.map((task) => {
                                const TypeIcon = typeIcon[task.type as keyof typeof typeIcon] || CircleDot;
                                const pStyle = priorityStyles[task.priority as keyof typeof priorityStyles] || "";

                                return (
                                  <div
                                    key={task._id || task.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-xs dark:border-slate-900 dark:bg-slate-900/40"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <TypeIcon className="h-3 w-3 text-slate-400 shrink-0" />
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                          {task.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                        <span className="uppercase">{task.type}</span>
                                        {task.priority && (
                                          <span className={cn("rounded px-1 border uppercase text-[9px] font-medium scale-95", pStyle)}>
                                            {task.priority}
                                          </span>
                                        )}
                                        {task.assignee && (
                                          <span className="truncate">
                                            Assignee: {task.assignee.name || task.assignee.email}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {canManageSprints && sprint.status !== "COMPLETED" && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 shrink-0"
                                        title="Move to Backlog"
                                        onClick={() =>
                                          handleRemoveTaskFromSprint(sprint._id, task._id || task.id)
                                        }
                                      >
                                        <Minus className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CreateSprintModal
        projectId={projectId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </AppShell>
  );
}
