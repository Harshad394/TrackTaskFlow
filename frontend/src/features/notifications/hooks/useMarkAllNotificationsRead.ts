import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markAllNotificationsRead } from "../api";
import { notificationsQueryKey } from "./useNotifications";

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
};
