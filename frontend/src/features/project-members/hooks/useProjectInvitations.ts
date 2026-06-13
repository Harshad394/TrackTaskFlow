import { useQuery } from "@tanstack/react-query";
import { getProjectInvitations } from "../api";

export const projectInvitationsQueryKey = (projectId: string) =>
  ["project-invitations", projectId] as const;

export const useProjectInvitations = (projectId: string, enabled = true) => {
  return useQuery({
    queryKey: projectInvitationsQueryKey(projectId),
    queryFn: () => getProjectInvitations(projectId),
    enabled: Boolean(projectId) && enabled,
    placeholderData: (prev) => prev,
  });
};
