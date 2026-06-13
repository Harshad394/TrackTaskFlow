export type ProjectMemberRole = "ADMIN" | "DEVELOPER" | "QA" | "CLIENT";

export interface ProjectMemberUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role?: string;
}

export interface ProjectMember {
  userId: string | ProjectMemberUser;
  role: ProjectMemberRole;
  _id?: string;
}

export interface ProjectWithMembers {
  _id: string;
  id?: string;
  name: string;
  key: string;
  description?: string;
  organization: string;
  status: "ACTIVE" | "ARCHIVED" | "COMPLETED";
  members: ProjectMember[];
}

export interface SearchUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
}

export interface SearchUsersResponse {
  users: SearchUser[];
  count: number;
}

export type ProjectInvitationStatus = "PENDING" | "ACCEPTED" | "CANCELLED";

export interface ProjectInvitation {
  _id: string;
  project: string;
  organization: string;
  email: string;
  role: ProjectMemberRole;
  invitedBy: { _id: string; name: string; email: string } | string;
  acceptedBy?: { _id: string; name: string; email: string } | string;
  status: ProjectInvitationStatus;
  acceptedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationsResponse {
  invitations: ProjectInvitation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

