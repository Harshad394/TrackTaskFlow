export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export interface Sprint {
  _id: string;
  id?: string;
  project: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  startDate?: string;
  endDate?: string;
  createdBy:
    | {
        _id: string;
        id?: string;
        name: string;
        email: string;
      }
    | string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSprintPayload {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSprintPayload {
  name?: string;
  goal?: string;
  status?: SprintStatus;
  startDate?: string;
  endDate?: string;
}

export interface BacklogResponse {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  tasks: any[]; // BoardTask / Task details
}
