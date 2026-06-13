export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "COMPLETED";

export interface Project {
  id: string; // might be mapped from _id
  _id: string;
  name: string;
  key: string;
  description?: string;
  organization: string; // The org ID
  status?: ProjectStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  key: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  key?: string;
  description?: string;
  status?: ProjectStatus;
}

