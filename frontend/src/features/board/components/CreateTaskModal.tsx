"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { ProjectMember } from "../../project-members/types";
import { BoardSection, TaskPriority, TaskType } from "../types";
import { sectionLabel } from "../utils";
import { AssigneeSelect, AssigneeUserRole } from "./AssigneeSelect";

interface CreateTaskModalProps {
  isOpen: boolean;
  section?: BoardSection | null;
  isLoading?: boolean;
  /** All members of the current project — used to populate the assignee dropdown */
  projectMembers?: ProjectMember[];
  /** Project role of the authenticated user */
  currentUserRole?: AssigneeUserRole;
  /** ID of the authenticated user */
  currentUserId?: string;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    priority: TaskPriority;
    type: TaskType;
    labels: string[];
    assignee?: string;
  }) => void;
}

export function CreateTaskModal({
  isOpen,
  section,
  isLoading,
  projectMembers = [],
  currentUserRole,
  currentUserId = "",
  onClose,
  onSubmit,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [type, setType] = useState<TaskType>("task");
  const [labels, setLabels] = useState("");
  const [assignee, setAssignee] = useState("");

  const canSubmit = useMemo(() => title.trim().length >= 2, [title]);

  // CLIENT cannot create/edit assignment controls
  const showAssignee =
    currentUserRole !== undefined && currentUserRole !== "CLIENT";

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    onSubmit({
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create task${section ? ` in ${sectionLabel(section)}` : ""}`}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          id="task-title"
          label="Title"
          placeholder="Implement login error states"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />

        <div>
          <label
            htmlFor="task-description"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Description
          </label>
          <textarea
            id="task-description"
            className="min-h-24 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-slate-100"
            placeholder="Add useful implementation details"
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
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
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
              onChange={(event) => setType(event.target.value as TaskType)}
            >
              <option value="task">Task</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
            </select>
          </div>
        </div>

        <Input
          id="task-labels"
          label="Labels"
          placeholder="frontend, auth, client"
          value={labels}
          onChange={(event) => setLabels(event.target.value)}
        />

        {showAssignee && currentUserRole && (
          <AssigneeSelect
            id="create-task-assignee"
            value={assignee}
            onChange={setAssignee}
            members={projectMembers}
            currentUserId={currentUserId}
            userRole={currentUserRole}
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!canSubmit}>
            Create task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
