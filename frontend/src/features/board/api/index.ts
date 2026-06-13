import api from "../../../lib/api";
import {
  ActivityResponse,
  Attachment,
  AttachmentsResponse,
  BoardResponse,
  BoardSection,
  BoardTask,
  CreateAttachmentPayload,
  CreateSectionPayload,
  CreateTaskPayload,
  MoveTaskPayload,
  TaskFilters,
  TasksResponse,
  UpdateSectionPayload,
  UpdateTaskPayload,
} from "../types";

// ── Attachments ───────────────────────────────────────────────────────────────

export const getTaskAttachments = async (
  taskId: string
): Promise<AttachmentsResponse> => {
  const response = await api.get(`/tasks/${taskId}/attachments`, {
    params: { limit: 50 },
  });
  return response.data;
};

export const createTaskAttachment = async (
  taskId: string,
  data: CreateAttachmentPayload
): Promise<Attachment> => {
  const response = await api.post(`/tasks/${taskId}/attachments`, data);
  return response.data.attachment;
};

export const deleteTaskAttachment = async (
  attachmentId: string
): Promise<void> => {
  await api.delete(`/attachments/${attachmentId}`);
};



// ── Section management ────────────────────────────────────────────────────────

export const createSection = async (
  projectId: string,
  data: CreateSectionPayload
): Promise<BoardSection> => {
  const response = await api.post(`/projects/${projectId}/sections`, data);
  return response.data.section;
};

export const updateSection = async (
  sectionId: string,
  data: UpdateSectionPayload
): Promise<BoardSection> => {
  const response = await api.patch(`/sections/${sectionId}`, data);
  return response.data.section;
};

/** Returns the raw axios response so callers can read the server error message. */
export const deleteSection = async (sectionId: string): Promise<void> => {
  await api.delete(`/sections/${sectionId}`);
};



export const getTaskActivity = async (
  taskId: string
): Promise<ActivityResponse> => {
  const response = await api.get(`/tasks/${taskId}/activity`, {
    params: { limit: 50 },
  });
  return response.data;
};


export const getProjectTasks = async (
  projectId: string,
  filters: TaskFilters
): Promise<TasksResponse> => {
  // strip undefined values so they don't appear as "undefined" in the query string
  const params: Record<string, string> = {};
  if (filters.q) params.q = filters.q;
  if (filters.priority) params.priority = filters.priority;
  if (filters.type) params.type = filters.type;
  if (filters.assignee) params.assignee = filters.assignee;
  if (filters.section) params.section = filters.section;
  if (filters.labels) params.labels = filters.labels;
  if (filters.dueFrom) params.dueFrom = filters.dueFrom;
  if (filters.dueTo) params.dueTo = filters.dueTo;
  params.limit = "200"; // fetch up to 200 matching tasks
  const response = await api.get(`/projects/${projectId}/tasks`, { params });
  return response.data;
};


export const getProjectBoard = async (projectId: string): Promise<BoardResponse> => {
  const response = await api.get(`/projects/${projectId}/board`);
  return response.data;
};

export const getProjectSections = async (projectId: string): Promise<BoardSection[]> => {
  const response = await api.get(`/projects/${projectId}/sections`);
  return response.data.sections;
};

export const createSectionTask = async (
  sectionId: string,
  data: CreateTaskPayload
): Promise<BoardTask> => {
  const response = await api.post(`/sections/${sectionId}/tasks`, data);
  return response.data.task;
};

export const updateTask = async (
  taskId: string,
  data: UpdateTaskPayload
): Promise<BoardTask> => {
  const response = await api.patch(`/tasks/${taskId}`, data);
  return response.data.task;
};

export const moveTask = async (
  taskId: string,
  data: MoveTaskPayload
): Promise<BoardTask> => {
  const response = await api.patch(`/tasks/${taskId}/move`, data);
  return response.data.task;
};

export const getTask = async (taskId: string): Promise<BoardTask> => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data.task;
};

export const requestApproval = async (taskId: string): Promise<BoardTask> => {
  const response = await api.patch(`/tasks/${taskId}/request-approval`, {});
  return response.data.task;
};

export const approveTask = async (taskId: string): Promise<BoardTask> => {
  const response = await api.patch(`/tasks/${taskId}/approve`, {});
  return response.data.task;
};

export const rejectTask = async (
  taskId: string,
  rejectionReason: string
): Promise<BoardTask> => {
  const response = await api.patch(`/tasks/${taskId}/reject`, {
    rejectionReason,
  });
  return response.data.task;
};

