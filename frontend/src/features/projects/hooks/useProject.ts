import { useQuery } from "@tanstack/react-query";
import { getProjectById } from "../api";

export const projectQueryKey = (projectId: string) => ["project", projectId] as const;

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: projectQueryKey(projectId),
    queryFn: () => getProjectById(projectId),
    enabled: Boolean(projectId),
  });
};
