import api from "../../../lib/api";
import { AppNotification, NotificationsResponse } from "../types";

export const getNotifications = async (): Promise<NotificationsResponse> => {
  const response = await api.get("/notifications", {
    params: { limit: 20 },
  });
  return response.data;
};

export const markNotificationRead = async (
  notificationId: string
): Promise<AppNotification> => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data.notification;
};

export const markAllNotificationsRead = async (): Promise<{ modifiedCount: number }> => {
  const response = await api.patch("/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};
