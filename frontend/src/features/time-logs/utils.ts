import { TimeLog, TimeLogTask, TimeLogUser } from "./types";

export const getTimeLogId = (timeLog: TimeLog) => timeLog._id || timeLog.id || "";

export const getLogUserName = (user: string | TimeLogUser) => {
  if (!user || typeof user === "string") return "Team member";
  return user.name || user.email || "Team member";
};

export const getLogTaskTitle = (task: string | TimeLogTask) => {
  if (!task || typeof task === "string") return "Task";
  return task.title || "Task";
};

export const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

export const formatLogDate = (value: string) => {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};
