import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteNotification } from "../api";
import { notificationsQueryKey } from "./useNotifications";

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
};
