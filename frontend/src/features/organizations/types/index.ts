export interface Organization {
  id: string; // The backend uses _id mapped to id or might just use _id, wait the API might return _id.
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationPayload {
  name: string;
}

export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

export interface OrganizationMember {
  userId: string;
  role: OrganizationRole;
  user?: {
    _id: string;
    id?: string;
    name: string;
    email: string;
  } | null;
}

export interface OrganizationMembersResponse {
  members: OrganizationMember[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

