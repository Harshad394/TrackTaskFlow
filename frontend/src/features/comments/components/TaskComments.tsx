"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, MessageSquare, Pencil, Send, Trash2, X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";
import { useMe } from "../../auth/hooks/useMe";
import { useCreateComment } from "../hooks/useCreateComment";
import { useDeleteComment } from "../hooks/useDeleteComment";
import { useProjectPermissions } from "../hooks/useProjectPermissions";
import { useTaskComments } from "../hooks/useTaskComments";
import { useUpdateComment } from "../hooks/useUpdateComment";
import { useUserSearch } from "../../project-members/hooks/useUserSearch";
import { SearchUser } from "../../project-members/types";
import {
  formatCommentDate,
  getCommentAuthor,
  getCommentId,
  getUserId,
} from "../utils";

interface TaskCommentsProps {
  taskId: string;
  projectId: string;
}

export function TaskComments({ taskId, projectId }: TaskCommentsProps) {
  const [body, setBody] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const { data: user } = useMe();
  const { data, isLoading } = useTaskComments(taskId);
  const { data: project } = useProjectPermissions(projectId);
  const createComment = useCreateComment(taskId);
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const [mentionIndex, setMentionIndex] = useState(-1);
  const [mentionQuery, setMentionQuery] = useState("");
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: searchResults } = useUserSearch(mentionQuery);

  const mergedSuggestions = useMemo(() => {
    if (mentionIndex === -1) return [];

    const members = project?.members || [];
    const q = mentionQuery.toLowerCase();
    const projectUsers = members
      .map((m: any) => m.userId)
      .filter((u: any) => u && (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)));

    const backendUsers = searchResults?.users || [];

    const seenIds = new Set<string>();
    const merged: any[] = [];

    for (const u of projectUsers) {
      const uid = u._id || u.id;
      if (uid && !seenIds.has(uid)) {
        seenIds.add(uid);
        merged.push({ ...u, isMember: true });
      }
    }

    for (const u of backendUsers) {
      const uid = u._id || u.id;
      if (uid && !seenIds.has(uid)) {
        seenIds.add(uid);
        merged.push({ ...u, isMember: false });
      }
    }

    return merged.slice(0, 10);
  }, [project, mentionIndex, mentionQuery, searchResults]);

  useEffect(() => {
    setActiveSuggestionIdx(0);
  }, [mergedSuggestions.length]);

  const handleSelectMention = (targetUser: SearchUser | any) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const before = body.slice(0, mentionIndex);
      const after = body.slice(start);
      const inserted = `@${targetUser.name || targetUser.email} `;
      const newBody = before + inserted + after;
      setBody(newBody);
      setMentionIndex(-1);
      setMentionQuery("");

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = before.length + inserted.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const currentProjectRole = useMemo(() => {
    const members = project?.members || [];
    const member = members.find((projectMember: any) => {
      const memberUserId =
        typeof projectMember.userId === "string"
          ? projectMember.userId
          : projectMember.userId?._id || projectMember.userId?.id;

      return memberUserId === user?.id;
    });

    return member?.role;
  }, [project, user?.id]);

  const canAdminManage = currentProjectRole === "ADMIN";

  const handleAddComment = (event: FormEvent) => {
    event.preventDefault();
    const trimmedBody = body.trim();
    if (!trimmedBody) return;

    createComment.mutate(trimmedBody, {
      onSuccess: () => setBody(""),
    });
  };

  return (
    <section className="border-t border-slate-200 p-5 dark:border-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <MessageSquare className="h-4 w-4" />
            Comments
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Share updates, feedback, and mentions.
          </p>
        </div>
      </div>

      <form className="mb-5 space-y-3 relative" onSubmit={handleAddComment}>
        <textarea
          ref={textareaRef}
          className="min-h-20 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-slate-100"
          placeholder="Add a comment..."
          value={body}
          onChange={(event) => {
            const val = event.target.value;
            setBody(val);
            const start = event.target.selectionStart;

            const textBeforeCursor = val.slice(0, start);
            const lastAtIdx = textBeforeCursor.lastIndexOf("@");
            if (lastAtIdx !== -1) {
              const textAfterAt = textBeforeCursor.slice(lastAtIdx + 1);
              if (!/\s/.test(textAfterAt)) {
                setMentionIndex(lastAtIdx);
                setMentionQuery(textAfterAt);
                return;
              }
            }
            setMentionIndex(-1);
            setMentionQuery("");
          }}
          onKeyDown={(e) => {
            if (mentionIndex !== -1 && mergedSuggestions.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSuggestionIdx((prev) => (prev + 1) % mergedSuggestions.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestionIdx(
                  (prev) => (prev - 1 + mergedSuggestions.length) % mergedSuggestions.length
                );
              } else if (e.key === "Enter") {
                e.preventDefault();
                handleSelectMention(mergedSuggestions[activeSuggestionIdx]);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setMentionIndex(-1);
                setMentionQuery("");
              }
            }
          }}
        />

        {mentionIndex !== -1 && mergedSuggestions.length > 0 && (
          <div className="absolute z-30 bottom-full mb-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-950">
            {mergedSuggestions.map((suggestion, idx) => (
              <button
                key={suggestion._id || suggestion.id}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                  idx === activeSuggestionIdx
                    ? "bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                    : "hover:bg-slate-50 dark:hover:bg-slate-900"
                )}
                onClick={() => handleSelectMention(suggestion)}
              >
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {suggestion.name}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">{suggestion.email}</span>
                </div>
                {suggestion.isMember && (
                  <span className="text-[10px] rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                    Member
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            isLoading={createComment.isPending}
            disabled={!body.trim()}
          >
            <Send className="mr-2 h-4 w-4" />
            Comment
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : data?.comments.length ? (
        <div className="space-y-4">
          {data.comments.map((comment) => {
            const commentId = getCommentId(comment);
            const author = getCommentAuthor(comment);
            const isOwner = getUserId(author) === user?.id;
            const canManage = isOwner || canAdminManage;
            const isEditing = editingCommentId === commentId;

            return (
              <article
                key={commentId}
                className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {author?.name || author?.email || "Unknown user"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatCommentDate(comment.createdAt)}
                      {comment.updatedAt !== comment.createdAt ? " · edited" : ""}
                    </p>
                  </div>

                  {canManage && !isEditing && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Edit comment"
                        onClick={() => {
                          setEditingCommentId(commentId);
                          setEditingBody(comment.body);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-rose-600 hover:text-rose-700"
                        title="Delete comment"
                        isLoading={deleteComment.isPending}
                        onClick={() => deleteComment.mutate(commentId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      className="min-h-20 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-slate-100"
                      value={editingBody}
                      onChange={(event) => setEditingBody(event.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingBody("");
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        isLoading={updateComment.isPending}
                        disabled={!editingBody.trim()}
                        onClick={() =>
                          updateComment.mutate(
                            { commentId, body: editingBody.trim() },
                            {
                              onSuccess: () => {
                                setEditingCommentId(null);
                                setEditingBody("");
                              },
                            }
                          )
                        }
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {comment.body}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No comments yet.
        </div>
      )}
    </section>
  );
}
