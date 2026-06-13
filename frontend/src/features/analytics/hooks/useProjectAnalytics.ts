import { useQuery } from "@tanstack/react-query";
import { getProjectAnalytics } from "../api";

export const projectAnalyticsQueryKey = (projectId: string) =>
  ["project-analytics", projectId] as const;

export const useProjectAnalytics = (projectId: string) => {
  return useQuery({
    queryKey: projectAnalyticsQueryKey(projectId),
    queryFn: () => getProjectAnalytics(projectId),
    enabled: Boolean(projectId),
  });
};
