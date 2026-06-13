import { CommentUser, TaskComment } from "./types";

export const getCommentId = (comment: TaskComment) => comment._id || comment.id || "";

export const getCommentAuthor = (comment: TaskComment): CommentUser | null => {
  if (!comment.author || typeof comment.author === "string") return null;
  return comment.author;
};

export const getUserId = (user?: { _id?: string; id?: string } | null) => {
  return user?._id || user?.id || "";
};

export const formatCommentDate = (value: string) => {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};
