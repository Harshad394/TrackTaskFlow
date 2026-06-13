import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveTask, rejectTask, requestApproval } from "../api";
import { BoardTask } from "../types";
import { boardQueryKey } from "./useBoard";
import { activityQueryKey } from "./useTaskActivity";

/**
 * All three approval mutations bundled together.
 * Each mutation:
 *  1. Calls the backend endpoint
 *  2. Invalidates the board cache so cards refresh
 *  3. Invalidates the activity log so the timeline updates
 *  4. Returns the updated task for the caller to update drawer state
 */
export const useApprovalActions = (projectId: string) => {
  const queryClient = useQueryClient();

  const invalidate = (taskId: string) => {
    queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId) });
    queryClient.invalidateQueries({ queryKey: activityQueryKey(taskId) });
  };

  const requestApprovalMutation = useMutation<
    BoardTask,
    Error,
    { taskId: string }
  >({
    mutationFn: ({ taskId }) => requestApproval(taskId),
    onSuccess: (_, { taskId }) => invalidate(taskId),
  });

  const approveMutation = useMutation<BoardTask, Error, { taskId: string }>({
    mutationFn: ({ taskId }) => approveTask(taskId),
    onSuccess: (_, { taskId }) => invalidate(taskId),
  });

  const rejectMutation = useMutation<
    BoardTask,
    Error,
    { taskId: string; rejectionReason: string }
  >({
    mutationFn: ({ taskId, rejectionReason }) =>
      rejectTask(taskId, rejectionReason),
    onSuccess: (_, { taskId }) => invalidate(taskId),
  });

  return {
    requestApproval: requestApprovalMutation,
    approve: approveMutation,
    reject: rejectMutation,
    isAnyPending:
      requestApprovalMutation.isPending ||
      approveMutation.isPending ||
      rejectMutation.isPending,
  };
};
