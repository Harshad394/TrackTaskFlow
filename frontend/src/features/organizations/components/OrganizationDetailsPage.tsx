"use client";

import Link from "next/link";
import { ArrowLeft, Search, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useMe } from "../../auth/hooks/useMe";
import { useUserSearch } from "../../project-members/hooks/useUserSearch";
import { SearchUser } from "../../project-members/types";
import { useAddOrganizationMember } from "../hooks/useAddOrganizationMember";
import { useOrganization } from "../hooks/useOrganization";
import { useOrganizationMembers } from "../hooks/useOrganizationMembers";
import { useRemoveOrganizationMember } from "../hooks/useRemoveOrganizationMember";
import { useUpdateOrganizationMember } from "../hooks/useUpdateOrganizationMember";
import { OrganizationRole } from "../types";

interface OrganizationDetailsPageProps {
  organizationId: string;
}

export function OrganizationDetailsPage({ organizationId }: OrganizationDetailsPageProps) {
  const { data: currentUser } = useMe();
  const { data: organization, isLoading: isLoadingOrg, isError: isErrorOrg, refetch: refetchOrg } = useOrganization(organizationId);
  const { data: membersData, isLoading: isLoadingMembers, isError: isErrorMembers, refetch: refetchMembers } = useOrganizationMembers(organizationId);

  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [role, setRole] = useState<OrganizationRole>("MEMBER");

  const { data: searchResults, isFetching: isSearching } = useUserSearch(query);

  const addMember = useAddOrganizationMember(organizationId);
  const updateMember = useUpdateOrganizationMember(organizationId);
  const removeMember = useRemoveOrganizationMember(organizationId);

  const currentMember = useMemo(() => {
    return membersData?.members.find(
      (m) => (m.user?._id || m.userId) === currentUser?.id
    );
  }, [membersData?.members, currentUser?.id]);

  const currentRole = currentMember?.role;
  const isOwnerOrAdmin = currentRole === "OWNER" || currentRole === "ADMIN";
  const isOwner = currentRole === "OWNER";

  const memberIds = useMemo(
    () => new Set((membersData?.members || []).map((m) => m.user?._id || m.userId)),
    [membersData?.members]
  );

  const availableUsers = (searchResults?.users || []).filter(
    (u) => !memberIds.has(u._id || u.id || "")
  );

  const handleAddMember = (e: FormEvent) => {
    e.preventDefault();
    const targetUserId = selectedUser?._id || selectedUser?.id;
    if (!targetUserId) return;

    addMember.mutate(
      { userId: targetUserId, role },
      {
        onSuccess: () => {
          setSelectedUser(null);
          setQuery("");
          setRole("MEMBER");
        },
      }
    );
  };

  const handleRoleChange = (userId: string, newRole: OrganizationRole) => {
    updateMember.mutate({ userId, role: newRole });
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate(userId);
  };

  if (isLoadingOrg || isLoadingMembers) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isErrorOrg || isErrorMembers || !organization) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
        Organization details could not be loaded.
        <Button
          className="ml-3"
          size="sm"
          variant="outline"
          onClick={() => {
            refetchOrg();
            refetchMembers();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const roleOptions: OrganizationRole[] = isOwner ? ["OWNER", "ADMIN", "MEMBER"] : ["ADMIN", "MEMBER"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/organizations"
            className="mb-2 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to organizations
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            <Users className="h-6 w-6 text-blue-600" />
            {organization.name}
          </h1>
          {organization.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {organization.description}
            </p>
          )}
        </div>
        <div className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
          Your role: <span className="font-semibold">{currentRole || "Member"}</span>
        </div>
      </div>

      {isOwnerOrAdmin && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <UserPlus className="h-4 w-4" />
            Add organization member
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
                  onChange={(event) => setRole(event.target.value as OrganizationRole)}
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                  {isOwner && <option value="OWNER">OWNER</option>}
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

      {!isOwnerOrAdmin && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          Only organization Owners or Admins can add, remove, or change member roles.
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
          {membersData?.members.map((member) => {
            const memberUserId = member.user?._id || member.userId;
            const isCurrentUser = memberUserId === currentUser?.id;
            const memberName = member.user?.name || "Unknown Member";
            const memberEmail = member.user?.email || "";

            // Determine if the actor can modify this member's role or remove them.
            // OWNER can modify/remove anyone (except last owner check handled by backend).
            // ADMIN can only modify/remove MEMBER-role users (cannot touch owners or other admins).
            const canModify = isOwnerOrAdmin && (
              isOwner || 
              (currentRole === "ADMIN" && member.role === "MEMBER")
            );

            // Determine what role options can be assigned to this member.
            // OWNERs can assign OWNER, ADMIN, MEMBER.
            // ADMINs can assign ADMIN, MEMBER.
            const targetRoleOptions = member.role === "OWNER" && !isOwner 
              ? ["OWNER"] // Non-owners cannot change OWNER role
              : (isOwner ? ["OWNER", "ADMIN", "MEMBER"] : ["ADMIN", "MEMBER"]);

            return (
              <div
                key={memberUserId}
                className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1fr_12rem_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {memberName}
                    {isCurrentUser ? " (you)" : ""}
                  </p>
                  <p className="truncate text-xs text-slate-500">{memberEmail}</p>
                </div>

                {canModify ? (
                  <select
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    value={member.role}
                    onChange={(event) =>
                      handleRoleChange(memberUserId, event.target.value as OrganizationRole)
                    }
                    disabled={updateMember.isPending}
                  >
                    {targetRoleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center font-medium">{member.role}</div>
                )}

                <div className="flex justify-end">
                  {canModify && !isCurrentUser && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-rose-600 hover:text-rose-700"
                      title="Remove member"
                      isLoading={removeMember.isPending && removeMember.variables === memberUserId}
                      onClick={() => handleRemoveMember(memberUserId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {updateMember.error && (
          <div className="border-t border-slate-200 bg-rose-50 px-4 py-2 text-xs text-rose-600 dark:border-slate-800 dark:bg-rose-950/20">
            {(updateMember.error as any)?.response?.data?.message || "Could not update role."}
          </div>
        )}
        {removeMember.error && (
          <div className="border-t border-slate-200 bg-rose-50 px-4 py-2 text-xs text-rose-600 dark:border-slate-800 dark:bg-rose-950/20">
            {(removeMember.error as any)?.response?.data?.message || "Could not remove member."}
          </div>
        )}
      </section>
    </div>
  );
}
