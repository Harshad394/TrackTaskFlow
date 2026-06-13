import { useQuery } from "@tanstack/react-query";
import { getTaskActivity } from "../api";

export const activityQueryKey = (taskId: string) =>
  ["task-activity", taskId] as const;

/**
 * Fetches the activity log for a task.
 * @param taskId  - the task to load activity for
 * @param enabled - set to false to pause fetching (e.g. while drawer is closed)
 */
export const useTaskActivity = (taskId: string, enabled = true) => {
  return useQuery({
    queryKey: activityQueryKey(taskId),
    queryFn: () => getTaskActivity(taskId),
    enabled: Boolean(taskId) && enabled,
    // Keep stale data visible while a background refetch is happening
    placeholderData: (prev) => prev,
  });
};
