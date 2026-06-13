import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProjectMemberRole } from "../api";
import { ProjectMemberRole } from "../types";
import { projectMembersQueryKey } from "./useProjectMembers";

export const useUpdateProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectMemberRole }) =>
      updateProjectMemberRole(projectId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectMembersQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: ["project-role", projectId] });
    },
  });
};
