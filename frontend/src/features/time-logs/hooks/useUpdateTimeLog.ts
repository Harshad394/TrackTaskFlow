import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTimeLog } from "../api";
import { UpdateTimeLogPayload } from "../types";
import { taskTimeLogsQueryKey } from "./useTaskTimeLogs";
import { projectTimeLogsQueryKey } from "./useProjectTimeLogs";

export const useUpdateTimeLog = (projectId?: string, taskId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      timeLogId,
      data,
    }: {
      timeLogId: string;
      data: UpdateTimeLogPayload;
    }) => updateTimeLog(timeLogId, data),
    onSuccess: (updatedLog) => {
      // Invalidate task logs if taskId is provided or in the response
      const resolvedTaskId = taskId || (typeof updatedLog.task === "object" ? updatedLog.task?._id || updatedLog.task?.id : updatedLog.task);
      if (resolvedTaskId) {
        queryClient.invalidateQueries({
          queryKey: taskTimeLogsQueryKey(resolvedTaskId),
        });
      }

      // Invalidate project logs if projectId is provided or in the response
      const resolvedProjectId = projectId || updatedLog.project;
      if (resolvedProjectId) {
        queryClient.invalidateQueries({
          queryKey: projectTimeLogsQueryKey(resolvedProjectId),
        });
      }

      // Also invalidate activity log since logging time creates/updates activities
      if (resolvedTaskId) {
        queryClient.invalidateQueries({
          queryKey: ["task-activity", resolvedTaskId],
        });
      }
    },
  });
};
