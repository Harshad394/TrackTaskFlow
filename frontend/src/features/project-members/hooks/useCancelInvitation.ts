import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelProjectInvitation } from "../api";
import { ProjectInvitation } from "../types";
import { projectInvitationsQueryKey } from "./useProjectInvitations";

export const useCancelInvitation = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ProjectInvitation, Error, { invitationId: string }>({
    mutationFn: ({ invitationId }) =>
      cancelProjectInvitation(projectId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectInvitationsQueryKey(projectId),
      });
    },
  });
};
