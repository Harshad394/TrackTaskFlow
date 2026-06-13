import { useQuery } from "@tanstack/react-query";
import { getTaskTimeLogs } from "../api";

export const taskTimeLogsQueryKey = (taskId: string) => ["task-time-logs", taskId] as const;

export const useTaskTimeLogs = (taskId: string, enabled = true) => {
  return useQuery({
    queryKey: taskTimeLogsQueryKey(taskId),
    queryFn: () => getTaskTimeLogs(taskId),
    enabled: Boolean(taskId) && enabled,
  });
};
