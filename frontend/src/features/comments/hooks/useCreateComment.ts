import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTaskComment } from "../api";
import { commentsQueryKey } from "./useTaskComments";
import { activityQueryKey } from "../../board/hooks/useTaskActivity";

export const useCreateComment = (taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => createTaskComment(taskId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsQueryKey(taskId) });
      queryClient.invalidateQueries({ queryKey: activityQueryKey(taskId) });
    },
  });
};
