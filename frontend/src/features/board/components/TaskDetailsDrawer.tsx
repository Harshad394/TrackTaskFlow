"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { cn } from "../../../lib/utils";
import { TaskComments } from "../../comments/components/TaskComments";
import { ProjectMember } from "../../project-members/types";
import { TaskTimeLogs } from "../../time-logs/components/TaskTimeLogs";
import { BoardTask, TaskPriority, TaskType } from "../types";
import { getId, getUserName } from "../utils";
import { AssigneeSelect, AssigneeUserRole } from "./AssigneeSelect";
import { ApprovalPanel } from "./ApprovalPanel";
import { TaskActivityLog } from "./TaskActivityLog";
import { TaskAttachments } from "./TaskAttachments";

/** Extract the raw userId string from a task's assignee field */
const getAssigneeId = (assignee: BoardTask["assignee"]): string => {
  if (!assignee) return "";
  if (typeof assignee === "string") return assignee;
  return assignee._id || assignee.id || "";
};

interface TaskDetailsDrawerProps {
  task: BoardTask | null;
  isOpen: boolean;
  isSaving?: boolean;
  projectId: string;
  /** All members of the current project — used to populate the assignee dropdown */
  projectMembers?: ProjectMember[];
  /** Project role of the authenticated user */
  currentUserRole?: AssigneeUserRole;
  /** ID of the authenticated user */
  currentUserId?: string;
  /**
   * Whether the current user may edit task fields.
   * When false the drawer shows a read-only view (CLIENT behaviour).
   */
  canEdit?: boolean;
  /** ADMIN / DEV / QA: may request client approval */
  canRequestApproval?: boolean;
  /** CLIENT + ADMIN: may approve or reject */
  canApproveReject?: boolean;
  /** ADMIN / DEV / QA: may add attachment metadata */
  canAddAttachment?: boolean;
  /** ADMIN: may delete any attachment */
  canDeleteAnyAttachment?: boolean;
  onClose: () => void;
  onSave: (
    taskId: string,
    data: {
      title: string;
      description?: string;
      priority: TaskPriority;
      type: TaskType;
      labels: string[];
      assignee?: string;
    }
  ) => void;
}

export function TaskDetailsDrawer({
  task,
  isOpen,
  isSaving,
  projectId,
  projectMembers = [],
  currentUserRole,
  currentUserId = "",
  canEdit = true,
  canRequestApproval = false,
  canApproveReject = false,
  canAddAttachment = false,
  canDeleteAnyAttachment = false,
  onClose,
  onSave,
}: TaskDetailsDrawerProps) {
  const [localTask, setLocalTask] = useState<BoardTask | null>(task);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [type, setType] = useState<TaskType>("task");
  const [labels, setLabels] = useState("");
  const [assignee, setAssignee] = useState("");

  // Sync local task and form fields whenever the parent task prop changes
  useEffect(() => {
    if (!task) return;
    setLocalTask(task);
    setTitle(task.title || "");
    setDescription(task.description || "");
    setPriority(task.priority || "medium");
    setType(task.type || "task");
    setLabels((task.labels || []).join(", "));
    setAssignee(getAssigneeId(task.assignee));
  }, [task]);

  const activeTask = localTask ?? task;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!activeTask || title.trim().length < 2 || !canEdit) return;

    onSave(getId(activeTask), {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      type,
      labels: labels
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean),
      assignee: assignee || undefined,
    });
  };

  // Show editable assignee dropdown only for non-CLIENT roles
  const showAssigneeDropdown =
    canEdit && currentUserRole !== undefined && currentUserRole !== "CLIENT";

  const showApprovalPanel =
    canRequestApproval || canApproveReject;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition",
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-slate-950/30 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-xl transition-transform dark:border-slate-800 dark:bg-slate-950",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Task details
            </p>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {activeTask ? getId(activeTask).slice(-8).toUpperCase() : "Task"}
            </h2>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} title="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {activeTask && (
          <>
            {canEdit ? (
              /* ── Editable form (ADMIN / DEVELOPER / QA) ─────────────── */
              <form className="space-y-5 p-5" onSubmit={handleSubmit}>
                <Input
                  label="Title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Description
                  </label>
                  <textarea
                    className="min-h-36 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-slate-100"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Priority
                    </label>
                    <select
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      value={priority}
                      onChange={(event) =>
                        setPriority(event.target.value as TaskPriority)
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Type
                    </label>
                    <select
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      value={type}
                      onChange={(event) =>
                        setType(event.target.value as TaskType)
                      }
                    >
                      <option value="task">Task</option>
                      <option value="bug">Bug</option>
                      <option value="feature">Feature</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Labels"
                  value={labels}
                  onChange={(event) => setLabels(event.target.value)}
                />

                {/* Assignee */}
                {showAssigneeDropdown && currentUserRole ? (
                  <AssigneeSelect
                    id="drawer-task-assignee"
                    value={assignee}
                    onChange={setAssignee}
                    members={projectMembers}
                    currentUserId={currentUserId}
                    userRole={currentUserRole}
                  />
                ) : (
                  <InfoRow label="Assignee" value={getUserName(activeTask.assignee)} />
                )}

                {/* Approval panel */}
                {showApprovalPanel && (
                  <ApprovalPanel
                    task={activeTask}
                    projectId={projectId}
                    canRequestApproval={canRequestApproval}
                    canApproveReject={canApproveReject}
                    onTaskUpdated={setLocalTask}
                  />
                )}

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSaving}
                    disabled={title.trim().length < 2}
                  >
                    Save changes
                  </Button>
                </div>
              </form>
            ) : (
              /* ── Read-only view (CLIENT) ─────────────────────────────── */
              <div className="space-y-4 p-5">
                {/* Title */}
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Title
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeTask.title}
                  </p>
                </div>

                {/* Description */}
                {activeTask.description && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Description
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                      {activeTask.description}
                    </p>
                  </div>
                )}

                {/* Meta grid */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                  <InfoRow label="Priority" value={activeTask.priority ?? "medium"} capitalize />
                  <InfoRow label="Type" value={activeTask.type ?? "task"} capitalize />
                  <InfoRow label="Assignee" value={getUserName(activeTask.assignee)} />
                </div>

                {/* Approval panel (CLIENT can approve/reject) */}
                {showApprovalPanel && (
                  <ApprovalPanel
                    task={activeTask}
                    projectId={projectId}
                    canRequestApproval={canRequestApproval}
                    canApproveReject={canApproveReject}
                    onTaskUpdated={setLocalTask}
                  />
                )}

                {/* Labels */}
                {activeTask.labels?.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Labels
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTask.labels.map((label) => (
                        <span
                          key={label}
                          className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            )}

            {/* Time logs — hidden for CLIENT (TaskTimeLogs internally checks canUseTaskTimeLogs) */}
            <TaskTimeLogs taskId={getId(activeTask)} projectId={activeTask.project} />

            {/* Attachments — all roles can view; upload gated by canAddAttachment */}
            <TaskAttachments
              taskId={getId(activeTask)}
              enabled={isOpen}
              canAdd={canAddAttachment}
              canDeleteAny={canDeleteAnyAttachment}
              currentUserId={currentUserId}
            />

            {/* Comments — available to all roles */}
            <TaskComments taskId={getId(activeTask)} projectId={activeTask.project} />

            {/* Activity log — always visible, only fetches while drawer is open */}
            <TaskActivityLog taskId={getId(activeTask)} enabled={isOpen} />
          </>
        )}
      </aside>
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span
        className={cn(
          "font-medium text-slate-900 dark:text-slate-100",
          capitalize && "capitalize"
        )}
      >
        {value}
      </span>
    </div>
  );
}
