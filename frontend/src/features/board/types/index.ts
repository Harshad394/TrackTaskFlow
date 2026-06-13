export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskType = "task" | "bug" | "feature";

export interface BoardUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
}

export interface BoardSection {
  _id: string;
  id?: string;
  name: string;
  order: number;
  project: string;
}

export interface BoardTask {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  project: string;
  section: string | BoardSection;
  createdBy: string | BoardUser;
  assignee?: string | BoardUser;
  priority: TaskPriority;
  type: TaskType;
  labels: string[];
  order: number;
  dueDate?: string;
  approvalStatus?: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  approvedBy?: string | BoardUser;
  sprint?: string | any;
  createdAt: string;
  updatedAt: string;
}

export interface BoardColumn {
  section: BoardSection;
  tasks: BoardTask[];
}

export interface BoardResponse {
  board: BoardColumn[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  type?: TaskType;
  labels?: string[];
  dueDate?: string;
  assignee?: string;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  section?: string;
  assignee?: string;
}

export interface MoveTaskPayload {
  section: string;
  order: number;
}

export interface CreateSectionPayload {
  name: string;
}

export interface UpdateSectionPayload {
  name?: string;
}

/** Mirrors the backend GET /projects/:projectId/tasks query parameters */
export interface TaskFilters {
  q?: string;
  priority?: TaskPriority;
  type?: TaskType;
  assignee?: string;
  section?: string;
  labels?: string;
  dueFrom?: string;
  dueTo?: string;
}

export interface TasksResponse {
  tasks: BoardTask[];
  count: number;
}

// ── Activity log ─────────────────────────────────────────────────────────────

export type ActivityAction =
  | "created"
  | "updated"
  | "moved"
  | "commented"
  | "time_logged"
  | "deleted"
  | "approval_requested"
  | "approved"
  | "rejected";

export interface ActivityUser {
  _id: string;
  name?: string;
  email?: string;
}

export interface ActivityEntry {
  _id: string;
  user: ActivityUser | string;
  task: string;
  action: ActivityAction;
  details?: string;
  createdAt: string;
}

export interface ActivityResponse {
  activities: ActivityEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Attachments ───────────────────────────────────────────────────────────────

export interface AttachmentUser {
  _id: string;
  name?: string;
  email?: string;
}

export interface Attachment {
  _id: string;
  task: string;
  project: string;
  uploadedBy: AttachmentUser | string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttachmentPayload {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface AttachmentsResponse {
  attachments: Attachment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

