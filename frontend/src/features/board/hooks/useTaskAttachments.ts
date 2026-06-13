import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTaskAttachment,
  deleteTaskAttachment,
  getTaskAttachments,
} from "../api";
import { CreateAttachmentPayload } from "../types";
import { activityQueryKey } from "./useTaskActivity";

export const attachmentsQueryKey = (taskId: string) =>
  ["task-attachments", taskId] as const;

/** Fetch all attachments for a task */
export const useTaskAttachments = (taskId: string, enabled = true) => {
  return useQuery({
    queryKey: attachmentsQueryKey(taskId),
    queryFn: () => getTaskAttachments(taskId),
    enabled: Boolean(taskId) && enabled,
    placeholderData: (prev) => prev,
  });
};

/** POST /tasks/:taskId/attachments */
export const useCreateAttachment = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAttachmentPayload) =>
      createTaskAttachment(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentsQueryKey(taskId) });
      // Also refresh the activity log since backend logs this as "updated"
      queryClient.invalidateQueries({ queryKey: activityQueryKey(taskId) });
    },
  });
};

/** DELETE /attachments/:attachmentId */
export const useDeleteAttachment = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => deleteTaskAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentsQueryKey(taskId) });
      queryClient.invalidateQueries({ queryKey: activityQueryKey(taskId) });
    },
  });
};
