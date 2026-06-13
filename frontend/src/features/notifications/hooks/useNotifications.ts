import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "../api";

export const notificationsQueryKey = ["notifications"] as const;

export const useNotifications = () => {
  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: getNotifications,
    refetchInterval: 60_000,
  });
};
