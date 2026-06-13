import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moveTask } from "../api";
import { MoveTaskPayload } from "../types";
import { boardQueryKey } from "./useBoard";
import { activityQueryKey } from "./useTaskActivity";

export const useMoveTask = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: MoveTaskPayload }) =>
      moveTask(taskId, data),
    onSuccess: (_result, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: activityQueryKey(taskId) });
    },
  });
};
