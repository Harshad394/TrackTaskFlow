import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTask } from "../api";
import { UpdateTaskPayload } from "../types";
import { boardQueryKey } from "./useBoard";
import { activityQueryKey } from "./useTaskActivity";

export const useUpdateTask = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskPayload }) =>
      updateTask(taskId, data),
    onSuccess: (_result, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: activityQueryKey(taskId) });
    },
  });
};
