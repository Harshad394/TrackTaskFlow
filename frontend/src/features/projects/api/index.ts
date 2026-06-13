import api from "../../../lib/api";
import { CreateProjectPayload, Project, UpdateProjectPayload } from "../types";

export const getProjects = async (orgId: string): Promise<Project[]> => {
  const response = await api.get(`/organizations/${orgId}/projects`);
  // Backend returns { pagination: {...}, projects: [...] }
  return response.data.projects;
};

export const createProject = async (orgId: string, data: CreateProjectPayload): Promise<Project> => {
  const response = await api.post(`/organizations/${orgId}/projects`, data);
  // Backend returns { project: {...} }
  return response.data.project;
};

export const getProjectById = async (projectId: string): Promise<Project> => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data.project;
};

export const updateProject = async (
  projectId: string,
  data: UpdateProjectPayload
): Promise<Project> => {
  const response = await api.patch(`/projects/${projectId}`, data);
  return response.data.project;
};

