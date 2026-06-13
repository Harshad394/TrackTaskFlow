import { useQuery } from "@tanstack/react-query";
import { getBacklog } from "../api";

export const backlogQueryKey = (projectId: string) => ["backlog", projectId] as const;

export const useBacklog = (projectId: string) => {
  return useQuery({
    queryKey: backlogQueryKey(projectId),
    queryFn: () => getBacklog(projectId),
    enabled: Boolean(projectId),
  });
};
