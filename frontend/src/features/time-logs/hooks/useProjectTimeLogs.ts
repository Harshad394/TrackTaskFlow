import { useQuery } from "@tanstack/react-query";
import { getProjectTimeLogs } from "../api";

export const projectTimeLogsQueryKey = (projectId: string) =>
  ["project-time-logs", projectId] as const;

export const useProjectTimeLogs = (projectId: string, enabled = true) => {
  return useQuery({
    queryKey: projectTimeLogsQueryKey(projectId),
    queryFn: () => getProjectTimeLogs(projectId),
    enabled: Boolean(projectId) && enabled,
  });
};
