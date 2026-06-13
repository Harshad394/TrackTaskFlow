import api from "../../../lib/api";
import { CreateTimeLogPayload, TimeLog, TimeLogsResponse, UpdateTimeLogPayload } from "../types";

export const getTaskTimeLogs = async (taskId: string): Promise<TimeLogsResponse> => {
  const response = await api.get(`/tasks/${taskId}/time-logs`, {
    params: { limit: 100 },
  });
  return response.data;
};

export const createTaskTimeLog = async (
  taskId: string,
  data: CreateTimeLogPayload
): Promise<TimeLog> => {
  const response = await api.post(`/tasks/${taskId}/time-logs`, data);
  return response.data.timeLog;
};

export const getProjectTimeLogs = async (
  projectId: string
): Promise<TimeLogsResponse> => {
  const response = await api.get(`/projects/${projectId}/time-logs`, {
    params: { limit: 100 },
  });
  return response.data;
};

export const getProjectForTimeLogs = async (projectId: string) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data.project;
};

export const updateTimeLog = async (
  timeLogId: string,
  data: UpdateTimeLogPayload
): Promise<TimeLog> => {
  const response = await api.patch(`/time-logs/${timeLogId}`, data);
  return response.data.timeLog;
};

export const deleteTimeLog = async (timeLogId: string): Promise<void> => {
  await api.delete(`/time-logs/${timeLogId}`);
};

