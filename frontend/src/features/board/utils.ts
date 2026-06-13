import { BoardSection, BoardTask } from "./types";

export const getId = (item: { _id?: string; id?: string }) => item._id || item.id || "";

export const getTaskSectionId = (task: BoardTask) => {
  return typeof task.section === "string" ? task.section : getId(task.section);
};

export const getUserName = (user?: string | { name?: string; email?: string }) => {
  if (!user || typeof user === "string") return "Unassigned";
  return user.name || user.email || "Unassigned";
};

export const sortByOrder = <T extends { order?: number; createdAt?: string }>(items: T[]) => {
  return [...items].sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return (a.createdAt || "").localeCompare(b.createdAt || "");
  });
};

export const sectionLabel = (section: BoardSection) => section.name || "Untitled";
