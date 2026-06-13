"use client";

import Link from "next/link";
import { ArrowLeft, Search, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useMe } from "../../auth/hooks/useMe";
import { useAddProjectMember } from "../hooks/useAddProjectMember";
import { useProjectMembers } from "../hooks/useProjectMembers";
import { useRemoveProjectMember } from "../hooks/useRemoveProjectMember";
import { useUpdateProjectMember } from "../hooks/useUpdateProjectMember";
import { useUserSearch } from "../hooks/useUserSearch";
import { ProjectMemberRole, SearchUser } from "../types";
import { getMemberEmail, getMemberName, getUserId, roleOptions } from "../utils";
import { ProjectInvitations } from "./ProjectInvitations";
import { ProjectDetailsSection } from "../../projects/components/ProjectDetailsSection";

interface ProjectMembersPageProps {
  projectId: string;
}

export function ProjectMembersPage({ projectId }: ProjectMembersPageProps) {
  const { data: user } = useMe();
  const { data: project, isLoading, isError, refetch } = useProjectMembers(projectId);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [role, setRole] = useState<ProjectMemberRole>("DEVELOPER");
  const { data: searchResults, isFetching: isSearching } = useUserSearch(query);
  const addMember = useAddProjectMember(projectId);
  const updateMember = useUpdateProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);

  const currentRole = useMemo(() => {
    return project?.members.find((member) => getUserId(member.userId) === user?.id)?.role;
  }, [project?.members, user?.id]);

  const isAdmin = currentRole === "ADMIN";
  const memberIds = useMemo(
    () => new Set((project?.members || []).map((member) => getUserId(member.userId))),
    [project?.members]
  );
  const availableUsers = (searchResults?.users || []).filter(
    (searchUser) => !memberIds.has(searchUser._id || searchUser.id || "")
  );

  const handleAddMember = (event: FormEvent) => {
    event.preventDefault();
    const selectedUserId = selectedUser?._id || selectedUser?.id;
    if (!selectedUserId) return;

    addMember.mutate(
      { userId: selectedUserId, role },
      {
        onSuccess: () => {
          setSelectedUser(null);
          setQuery("");
          setRole("DEVELOPER");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
        Project settings could not be loaded.
        <Button className="ml-3" size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/projects/${projectId}/board`}
            className="mb-2 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to board
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            <Users className="h-6 w-6 text-blue-600" />
            Project members
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage roles for {project.key} · {project.name}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
          Your role: <span className="font-semibold">{currentRole || "Member"}</span>
        </div>
      </div>

      <ProjectDetailsSection projectId={projectId} isAdmin={isAdmin} />

      {isAdmin && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <UserPlus className="h-4 w-4" />
            Add member
          </h2>
          <form className="mt-4 space-y-4" onSubmit={handleAddMember}>
            <div className="grid gap-3 lg:grid-cols-[1fr_12rem_auto]">
              <div className="relative">
                <Input
                  label="Search users"
                  placeholder="Search by name or email"
                  value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : query}
                  onChange={(event) => {
                    setSelectedUser(null);
                    setQuery(event.target.value);
                  }}
                />
                {query.trim().length >= 2 && !selectedUser && (
                  <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
                    {isSearching ? (
                      <div className="p-3 text-sm text-slate-500">Searching...</div>
                    ) : availableUsers.length ? (
                      availableUsers.map((searchUser) => (
                        <button
                          key={searchUser._id || searchUser.id}
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                          onClick={() => setSelectedUser(searchUser)}
                        >
                          <span className="block font-medium text-slate-900 dark:text-slate-100">
                            {searchUser.name}
                          </span>
                          <span className="text-xs text-slate-500">{searchUser.email}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-slate-500">No users found.</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Role
                </label>
                <select
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={role}
                  onChange={(event) => setRole(event.target.value as ProjectMemberRole)}
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button type="submit" isLoading={addMember.isPending} disabled={!selectedUser}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
            {addMember.error && (
              <p className="text-sm text-rose-600">
                {(addMember.error as any)?.response?.data?.message || "Could not add member."}
              </p>
            )}
          </form>
        </section>
      )}

      {!isAdmin && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          Only project admins can add, remove, or change member roles.
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Shield className="h-4 w-4" />
            Members
          </h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-900">
          {project.members.map((member) => {
            const memberUserId = getUserId(member.userId);
            const isCurrentUser = memberUserId === user?.id;

            return (
              <div
                key={memberUserId}
                className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1fr_12rem_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {getMemberName(member)}
                    {isCurrentUser ? " (you)" : ""}
                  </p>
                  <p className="truncate text-xs text-slate-500">{getMemberEmail(member)}</p>
                </div>

                {isAdmin ? (
                  <select
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    value={member.role}
                    onChange={(event) =>
                      updateMember.mutate({
                        userId: memberUserId,
                        role: event.target.value as ProjectMemberRole,
                      })
                    }
                    disabled={updateMember.isPending}
                  >
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="font-medium">{member.role}</div>
                )}

                <div className="flex justify-end">
                  {isAdmin && !isCurrentUser && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-rose-600 hover:text-rose-700"
                      title="Remove member"
                      isLoading={removeMember.isPending}
                      onClick={() => removeMember.mutate(memberUserId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {isAdmin && (
        <ProjectInvitations projectId={projectId} />
      )}
    </div>
  );
}

