import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateComment } from "../api";
import { commentsQueryKey } from "./useTaskComments";

export const useUpdateComment = (taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      updateComment(commentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsQueryKey(taskId) });
    },
  });
};
