import { useQuery } from "@tanstack/react-query";
import { getTaskComments } from "../api";

export const commentsQueryKey = (taskId: string) => ["comments", taskId] as const;

export const useTaskComments = (taskId: string) => {
  return useQuery({
    queryKey: commentsQueryKey(taskId),
    queryFn: () => getTaskComments(taskId),
    enabled: Boolean(taskId),
  });
};
