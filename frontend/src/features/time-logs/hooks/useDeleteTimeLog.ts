import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTimeLog } from "../api";
import { taskTimeLogsQueryKey } from "./useTaskTimeLogs";
import { projectTimeLogsQueryKey } from "./useProjectTimeLogs";

export const useDeleteTimeLog = (projectId?: string, taskId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (timeLogId: string) => deleteTimeLog(timeLogId),
    onSuccess: () => {
      // Since delete does not return the full object, we invalidate all if specific not provided
      if (taskId) {
        queryClient.invalidateQueries({
          queryKey: taskTimeLogsQueryKey(taskId),
        });
        queryClient.invalidateQueries({
          queryKey: ["task-activity", taskId],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["task-time-logs"] });
        queryClient.invalidateQueries({ queryKey: ["task-activity"] });
      }

      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: projectTimeLogsQueryKey(projectId),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["project-time-logs"] });
      }
    },
  });
};
