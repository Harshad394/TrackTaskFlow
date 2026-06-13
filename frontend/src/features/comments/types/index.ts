export interface CommentUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
}

export interface TaskComment {
  _id: string;
  id?: string;
  task: string;
  project: string;
  author: string | CommentUser;
  body: string;
  mentions: CommentUser[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  comments: TaskComment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
