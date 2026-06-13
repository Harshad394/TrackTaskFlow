import api from "../../../lib/api";
import {
  InvitationsResponse,
  ProjectInvitation,
  ProjectMemberRole,
  ProjectWithMembers,
  SearchUsersResponse,
} from "../types";

export interface InviteMemberResponse {
  message: string;
  status: "ACCEPTED" | "PENDING";
  user?: {
    id: string;
    name: string;
    email: string;
  };
  project?: ProjectWithMembers;
  invitation?: ProjectInvitation;
}

export const getProjectWithMembers = async (
  projectId: string
): Promise<ProjectWithMembers> => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data.project;
};

export const searchUsers = async (query: string): Promise<SearchUsersResponse> => {
  const response = await api.get("/users/search", {
    params: { q: query, limit: 8 },
  });
  return response.data;
};

export const addProjectMember = async (
  projectId: string,
  userId: string,
  role: ProjectMemberRole
): Promise<ProjectWithMembers> => {
  const response = await api.post(`/projects/${projectId}/members`, { userId, role });
  return response.data.project;
};

export const updateProjectMemberRole = async (
  projectId: string,
  userId: string,
  role: ProjectMemberRole
): Promise<ProjectWithMembers> => {
  const response = await api.patch(`/projects/${projectId}/members/${userId}`, { role });
  return response.data.project;
};

export const removeProjectMember = async (
  projectId: string,
  userId: string
): Promise<void> => {
  await api.delete(`/projects/${projectId}/members/${userId}`);
};

export const getProjectInvitations = async (
  projectId: string
): Promise<InvitationsResponse> => {
  const response = await api.get(`/projects/${projectId}/invitations`);
  return response.data;
};

export const inviteMember = async (
  projectId: string,
  email: string,
  role: ProjectMemberRole
): Promise<InviteMemberResponse> => {
  const response = await api.post(`/projects/${projectId}/invitations`, { email, role });
  return response.data;
};

export const cancelProjectInvitation = async (
  projectId: string,
  invitationId: string
): Promise<ProjectInvitation> => {
  const response = await api.patch(`/projects/${projectId}/invitations/${invitationId}/cancel`);
  return response.data.invitation;
};

