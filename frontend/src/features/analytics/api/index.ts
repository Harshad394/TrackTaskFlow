import api from "../../../lib/api";
import { ProjectAnalytics } from "../types";

export const getProjectAnalytics = async (
  projectId: string
): Promise<ProjectAnalytics> => {
  const response = await api.get(`/projects/${projectId}/analytics`);
  return response.data;
};
