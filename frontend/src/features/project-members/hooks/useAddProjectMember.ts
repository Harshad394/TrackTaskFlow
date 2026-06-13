import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addProjectMember } from "../api";
import { ProjectMemberRole } from "../types";
import { projectMembersQueryKey } from "./useProjectMembers";

export const useAddProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectMemberRole }) =>
      addProjectMember(projectId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectMembersQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: ["project-role", projectId] });
    },
  });
};
