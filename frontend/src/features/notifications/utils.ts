import {
  AppNotification,
  NotificationProject,
  NotificationTask,
  NotificationUser,
} from "./types";

export const getNotificationId = (notification: AppNotification) => {
  return notification._id || notification.id || "";
};

export const getActorName = (actor: string | NotificationUser) => {
  if (!actor || typeof actor === "string") return "Someone";
  return actor.name || actor.email || "Someone";
};

export const getProjectLabel = (project: string | NotificationProject) => {
  if (!project || typeof project === "string") return "";
  return project.key ? `${project.key} · ${project.name}` : project.name;
};

export const getTaskTitle = (task?: string | NotificationTask) => {
  if (!task || typeof task === "string") return "";
  return task.title || "";
};

export const formatNotificationDate = (value: string) => {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};
