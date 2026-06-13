"use client";

import { ProjectMember } from "../../project-members/types";
import {
  getMemberEmail,
  getMemberName,
  getUserId,
} from "../../project-members/utils";

/** Mirrors ProjectMemberRole from project-members types */
export type AssigneeUserRole = "ADMIN" | "DEVELOPER" | "QA" | "CLIENT";

interface AssigneeSelectProps {
  /** Current selected userId, or "" for unassigned */
  value: string;
  onChange: (userId: string) => void;
  members: ProjectMember[];
  /** ID of the currently authenticated user */
  currentUserId: string;
  /** Project role of the currently authenticated user */
  userRole: AssigneeUserRole;
  label?: string;
  id?: string;
}

/**
 * Assignee dropdown.
 * - ADMIN can select any project member.
 * - DEVELOPER / QA can only select themselves (or clear the assignment).
 * - CLIENT should NOT render this component at all (enforced by callers).
 */
export function AssigneeSelect({
  value,
  onChange,
  members,
  currentUserId,
  userRole,
  label = "Assignee",
  id = "assignee-select",
}: AssigneeSelectProps) {
  const allowedMembers =
    userRole === "ADMIN"
      ? members
      : members.filter((m) => getUserId(m.userId) === currentUserId);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {label}
      </label>
      <select
        id={id}
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Unassigned —</option>
        {allowedMembers.map((member) => {
          const uid = getUserId(member.userId);
          const name = getMemberName(member);
          const email = getMemberEmail(member);
          return (
            <option key={uid} value={uid}>
              {name} · {email} · {member.role}
            </option>
          );
        })}
      </select>
    </div>
  );
}
