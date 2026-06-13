import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteComment } from "../api";
import { commentsQueryKey } from "./useTaskComments";

export const useDeleteComment = (taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsQueryKey(taskId) });
    },
  });
};
