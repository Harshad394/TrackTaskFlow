export interface TimeLogUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
}

export interface TimeLogTask {
  _id?: string;
  id?: string;
  title: string;
  priority?: string;
  type?: string;
}

export interface TimeLog {
  _id: string;
  id?: string;
  task: string | TimeLogTask;
  project: string;
  user: string | TimeLogUser;
  minutes: number;
  note?: string;
  billable: boolean;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeLogsResponse {
  totalMinutes: number;
  billableMinutes: number;
  count?: number;
  timeLogs: TimeLog[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTimeLogPayload {
  minutes: number;
  note?: string;
  billable?: boolean;
  loggedAt?: string;
}

export interface UpdateTimeLogPayload {
  minutes?: number;
  note?: string;
  billable?: boolean;
  loggedAt?: string;
}

export type ProjectRole = "ADMIN" | "DEVELOPER" | "QA" | "CLIENT";

