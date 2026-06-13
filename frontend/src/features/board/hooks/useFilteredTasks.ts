import { useQuery } from "@tanstack/react-query";
import { getProjectTasks } from "../api";
import { TaskFilters } from "../types";

export const filteredTasksQueryKey = (
  projectId: string,
  filters: TaskFilters
) => ["filtered-tasks", projectId, filters] as const;

/** True when at least one filter field is non-empty */
export const hasActiveFilters = (filters: TaskFilters): boolean =>
  Object.values(filters).some((v) => v !== undefined && v !== "");

export const useFilteredTasks = (projectId: string, filters: TaskFilters) => {
  const active = hasActiveFilters(filters);
  return useQuery({
    queryKey: filteredTasksQueryKey(projectId, filters),
    queryFn: () => getProjectTasks(projectId, filters),
    enabled: Boolean(projectId) && active,
    // Keep previous results visible while a new filter request is in-flight
    placeholderData: (prev) => prev,
  });
};
