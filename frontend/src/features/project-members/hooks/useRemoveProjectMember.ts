import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeProjectMember } from "../api";
import { projectMembersQueryKey } from "./useProjectMembers";

export const useRemoveProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeProjectMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectMembersQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: ["project-role", projectId] });
    },
  });
};
