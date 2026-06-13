import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProject } from "../api";
import { UpdateProjectPayload } from "../types";
import { projectQueryKey } from "./useProject";

export const useUpdateProject = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProjectPayload) => updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
  });
};
