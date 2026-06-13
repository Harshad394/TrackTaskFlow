"use client";

import { Ban, CheckCircle2, Clock, Mail, Send, XCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { cn } from "../../../lib/utils";
import { useCancelInvitation } from "../hooks/useCancelInvitation";
import { useInviteMember } from "../hooks/useInviteMember";
import { useProjectInvitations } from "../hooks/useProjectInvitations";
import { ProjectMemberRole } from "../types";
import { roleOptions } from "../utils";

interface ProjectInvitationsProps {
  projectId: string;
}

export function ProjectInvitations({ projectId }: ProjectInvitationsProps) {
  const { data, isLoading, isError, refetch } = useProjectInvitations(projectId);
  const inviteMutation = useInviteMember(projectId);
  const cancelMutation = useCancelInvitation(projectId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectMemberRole>("DEVELOPER");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInvite = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    inviteMutation.mutate(
      { email: trimmedEmail, role },
      {
        onSuccess: (res) => {
          setEmail("");
          setRole("DEVELOPER");
          if (res.status === "ACCEPTED") {
            setSuccessMessage(
              `User ${res.user?.name || trimmedEmail} is already registered and has been added directly to the project!`
            );
          } else {
            setSuccessMessage(`Invitation sent to ${trimmedEmail} successfully.`);
          }
        },
      }
    );
  };

  const handleCancel = (invitationId: string) => {
    setSuccessMessage(null);
    cancelMutation.mutate({ invitationId });
  };

  const invitations = data?.invitations ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
        Could not load invitations.
        <Button className="ml-3" size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite Member Section */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Mail className="h-4 w-4" />
          Invite by email
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Invite users to join this project. If they are already registered on TrackTaskFlow, they will be added immediately.
        </p>

        <form className="mt-4 space-y-4" onSubmit={handleInvite}>
          <div className="grid gap-3 lg:grid-cols-[1fr_12rem_auto]">
            <Input
              label="Email address"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Project Role
              </label>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={role}
                onChange={(e) => setRole(e.target.value as ProjectMemberRole)}
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button type="submit" isLoading={inviteMutation.isPending} disabled={!email.trim()}>
                <Send className="mr-2 h-4 w-4" />
                Send Invite
              </Button>
            </div>
          </div>

          {inviteMutation.isError && (
            <p className="text-sm text-rose-600">
              {(inviteMutation.error as any)?.response?.data?.message ||
                "Failed to send invitation."}
            </p>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 rounded bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>
      </section>

      {/* Invitations List */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Mail className="h-4 w-4" />
            Sent Invitations
          </h2>
        </div>

        {invitations.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No invitations sent yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-900">
            {invitations.map((inv) => {
              const invitedByText =
                typeof inv.invitedBy === "object" && inv.invitedBy
                  ? inv.invitedBy.name || inv.invitedBy.email
                  : "System";

              return (
                <div
                  key={inv._id}
                  className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1fr_8rem_8rem_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {inv.email}
                    </p>
                    <p className="text-xs text-slate-500">Invited by: {invitedByText}</p>
                  </div>

                  <div className="flex items-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {inv.role}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <InvitationStatusBadge status={inv.status} />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {inv.status === "PENDING" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20"
                        isLoading={cancelMutation.isPending && cancelMutation.variables?.invitationId === inv._id}
                        onClick={() => handleCancel(inv._id)}
                      >
                        <Ban className="mr-1.5 h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function InvitationStatusBadge({ status }: { status: string }) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <Clock className="h-3.5 w-3.5" />
        Pending
      </span>
    );
  }
  if (status === "ACCEPTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Accepted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      <XCircle className="h-3.5 w-3.5" />
      Cancelled
    </span>
  );
}
