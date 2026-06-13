import api from "../../../lib/api";
import {
  BacklogResponse,
  CreateSprintPayload,
  Sprint,
  UpdateSprintPayload,
} from "../types";

export const getSprints = async (projectId: string): Promise<{ sprints: Sprint[] }> => {
  const response = await api.get(`/projects/${projectId}/sprints`);
  return response.data;
};

export const createSprint = async (
  projectId: string,
  payload: CreateSprintPayload
): Promise<{ sprint: Sprint }> => {
  const response = await api.post(`/projects/${projectId}/sprints`, payload);
  return response.data;
};

export const getBacklog = async (projectId: string): Promise<BacklogResponse> => {
  const response = await api.get(`/projects/${projectId}/backlog`, {
    params: { limit: 100 }, // fetch up to 100 backlog items
  });
  return response.data;
};

export const updateSprint = async (
  sprintId: string,
  payload: UpdateSprintPayload
): Promise<{ sprint: Sprint }> => {
  const response = await api.patch(`/sprints/${sprintId}`, payload);
  return response.data;
};

export const addTaskToSprint = async (
  sprintId: string,
  taskId: string
): Promise<void> => {
  await api.post(`/sprints/${sprintId}/tasks/${taskId}`);
};

export const removeTaskFromSprint = async (
  sprintId: string,
  taskId: string
): Promise<void> => {
  await api.delete(`/sprints/${sprintId}/tasks/${taskId}`);
};
