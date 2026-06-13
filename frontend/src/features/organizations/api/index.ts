import api from "../../../lib/api";
import {
  CreateOrganizationPayload,
  Organization,
  OrganizationMember,
  OrganizationMembersResponse,
  OrganizationRole,
} from "../types";

export const getOrganizations = async (): Promise<Organization[]> => {
  const response = await api.get("/organizations");
  // The backend returns { pagination: {...}, organizations: [...] }
  return response.data.organizations;
};

export const createOrganization = async (data: CreateOrganizationPayload): Promise<Organization> => {
  const response = await api.post("/organizations", data);
  // Backend returns { organization: {...} }
  return response.data.organization;
};

export const getOrganization = async (organizationId: string): Promise<Organization> => {
  const response = await api.get(`/organizations/${organizationId}`);
  return response.data.organization;
};

export const getOrganizationMembers = async (
  organizationId: string
): Promise<OrganizationMembersResponse> => {
  const response = await api.get(`/organizations/${organizationId}/members`, {
    params: { limit: 100 },
  });
  return response.data;
};

export const addOrganizationMember = async (
  organizationId: string,
  userId: string,
  role: OrganizationRole
): Promise<OrganizationMember> => {
  const response = await api.post(`/organizations/${organizationId}/members`, {
    userId,
    role,
  });
  return response.data.member;
};

export const updateOrganizationMemberRole = async (
  organizationId: string,
  userId: string,
  role: OrganizationRole
): Promise<OrganizationMember> => {
  const response = await api.patch(
    `/organizations/${organizationId}/members/${userId}`,
    { role }
  );
  return response.data.member;
};

export const removeOrganizationMember = async (
  organizationId: string,
  userId: string
): Promise<void> => {
  await api.delete(`/organizations/${organizationId}/members/${userId}`);
};

