export type NotificationType =
  | "task_assigned"
  | "task_commented"
  | "task_moved"
  | "task_approval_requested"
  | "task_approved"
  | "task_rejected"
  | "task_comment_mention";

export interface NotificationUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
}

export interface NotificationProject {
  _id?: string;
  id?: string;
  name: string;
  key: string;
}

export interface NotificationTask {
  _id?: string;
  id?: string;
  title: string;
  priority?: string;
  type?: string;
}

export interface AppNotification {
  _id: string;
  id?: string;
  recipient: string;
  actor: string | NotificationUser;
  project: string | NotificationProject;
  task?: string | NotificationTask;
  type: NotificationType;
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  unreadCount: number;
  count: number;
  notifications: AppNotification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
