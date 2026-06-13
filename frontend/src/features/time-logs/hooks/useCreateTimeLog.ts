import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTaskTimeLog } from "../api";
import { CreateTimeLogPayload } from "../types";
import { taskTimeLogsQueryKey } from "./useTaskTimeLogs";
import { activityQueryKey } from "../../board/hooks/useTaskActivity";

export const useCreateTimeLog = (taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTimeLogPayload) => createTaskTimeLog(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskTimeLogsQueryKey(taskId) });
      queryClient.invalidateQueries({ queryKey: activityQueryKey(taskId) });
    },
  });
};
