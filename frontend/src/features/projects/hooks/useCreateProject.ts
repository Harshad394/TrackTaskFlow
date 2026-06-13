import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "../api";
import { CreateProjectPayload } from "../types";

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: CreateProjectPayload }) =>
      createProject(orgId, data),
    onSuccess: (_, variables) => {
      // Invalidate the projects list for the specific org
      queryClient.invalidateQueries({ queryKey: ["projects", variables.orgId] });
    },
  });
};
