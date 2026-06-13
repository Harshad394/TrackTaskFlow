import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteMember, InviteMemberResponse } from "../api";
import { ProjectMemberRole } from "../types";
import { projectInvitationsQueryKey } from "./useProjectInvitations";
import { projectMembersQueryKey } from "./useProjectMembers";

export const useInviteMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    InviteMemberResponse,
    Error,
    { email: string; role: ProjectMemberRole }
  >({
    mutationFn: ({ email, role }) => inviteMember(projectId, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectInvitationsQueryKey(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectMembersQueryKey(projectId),
      });
    },
  });
};
