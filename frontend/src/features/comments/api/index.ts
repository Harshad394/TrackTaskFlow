import api from "../../../lib/api";
import { CommentsResponse, TaskComment } from "../types";

export const getTaskComments = async (taskId: string): Promise<CommentsResponse> => {
  const response = await api.get(`/tasks/${taskId}/comments`, {
    params: { limit: 100 },
  });
  return response.data;
};

export const createTaskComment = async (
  taskId: string,
  body: string
): Promise<TaskComment> => {
  const response = await api.post(`/tasks/${taskId}/comments`, { body });
  return response.data.comment;
};

export const updateComment = async (
  commentId: string,
  body: string
): Promise<TaskComment> => {
  const response = await api.patch(`/comments/${commentId}`, { body });
  return response.data.comment;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  await api.delete(`/comments/${commentId}`);
};

export const getProjectForPermissions = async (projectId: string) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data.project;
};
