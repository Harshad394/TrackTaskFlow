"use client";

import {
  ExternalLink,
  File,
  FileImage,
  FileText,
  FileVideo,
  Paperclip,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";
import { Attachment, AttachmentUser, CreateAttachmentPayload } from "../types";
import {
  useCreateAttachment,
  useDeleteAttachment,
  useTaskAttachments,
} from "../hooks/useTaskAttachments";

// ── Helpers ──────────────────────────────────────────────────────────────────

const getUploaderName = (uploadedBy: Attachment["uploadedBy"]): string => {
  if (typeof uploadedBy === "string") return "Unknown";
  const u = uploadedBy as AttachmentUser;
  return u.name || u.email || "Unknown";
};

const getUploaderId = (uploadedBy: Attachment["uploadedBy"]): string => {
  if (typeof uploadedBy === "string") return uploadedBy;
  return (uploadedBy as AttachmentUser)._id;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Pick an icon by MIME type category */
function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith("image/")) return <FileImage className={className} />;
  if (mimeType.startsWith("video/")) return <FileVideo className={className} />;
  if (mimeType.startsWith("text/") || mimeType.includes("pdf"))
    return <FileText className={className} />;
  return <File className={className} />;
}

// ── Add-attachment form ───────────────────────────────────────────────────────

function AddAttachmentForm({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose: () => void;
}) {
  const mutation = useCreateAttachment(taskId);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("application/octet-stream");
  const [fileSize, setFileSize] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const sizeNum = parseInt(fileSize, 10);
    if (!fileName.trim() || !fileUrl.trim() || !fileType.trim() || isNaN(sizeNum) || sizeNum < 1)
      return;

    const payload: CreateAttachmentPayload = {
      fileName: fileName.trim(),
      fileUrl: fileUrl.trim(),
      fileType: fileType.trim(),
      fileSize: sizeNum,
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        setFileName("");
        setFileUrl("");
        setFileType("application/octet-stream");
        setFileSize("");
        onClose();
      },
    });
  };

  const inputCls =
    "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
  const labelCls = "mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <label className={labelCls}>File name *</label>
        <input
          className={inputCls}
          placeholder="design-mockup.png"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          maxLength={255}
          required
          autoFocus
        />
      </div>

      <div>
        <label className={labelCls}>File URL *</label>
        <input
          className={inputCls}
          placeholder="https://example.com/file.png"
          type="url"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          maxLength={2048}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>MIME type *</label>
          <input
            className={inputCls}
            placeholder="image/png"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            maxLength={100}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Size (bytes) *</label>
          <input
            className={inputCls}
            placeholder="204800"
            type="number"
            min={1}
            value={fileSize}
            onChange={(e) => setFileSize(e.target.value)}
            required
          />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-xs text-rose-500">
          {(mutation.error as any)?.response?.data?.message ||
            "Could not add attachment."}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          className="flex-1"
          isLoading={mutation.isPending}
          disabled={
            !fileName.trim() ||
            !fileUrl.trim() ||
            !fileType.trim() ||
            !fileSize
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add attachment
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}

// ── Single attachment row ─────────────────────────────────────────────────────

function AttachmentRow({
  attachment,
  taskId,
  currentUserId,
  canDeleteAny,
}: {
  attachment: Attachment;
  taskId: string;
  currentUserId: string;
  canDeleteAny: boolean;
}) {
  const deleteMutation = useDeleteAttachment(taskId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isUploader = getUploaderId(attachment.uploadedBy) === currentUserId;
  const canDelete = canDeleteAny || isUploader;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <FileIcon mimeType={attachment.fileType} className="h-4 w-4" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <a
          href={attachment.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-1 truncate text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          title={attachment.fileName}
        >
          <span className="truncate">{attachment.fileName}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {formatBytes(attachment.fileSize)} · {getUploaderName(attachment.uploadedBy)}
        </p>
      </div>

      {/* Delete controls */}
      {canDelete && !confirmDelete && (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="shrink-0 rounded p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
          title="Delete attachment"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {confirmDelete && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() =>
              deleteMutation.mutate(attachment._id, {
                onSuccess: () => setConfirmDelete(false),
              })
            }
            disabled={deleteMutation.isPending}
            className={cn(
              "rounded p-1 text-rose-500 hover:text-rose-700",
              deleteMutation.isPending && "opacity-50"
            )}
            title="Confirm delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="rounded p-1 text-slate-400 hover:text-slate-700"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface TaskAttachmentsProps {
  taskId: string;
  /** Only fetch while the drawer is open */
  enabled?: boolean;
  /** ADMIN / DEV / QA — may add new attachments */
  canAdd?: boolean;
  /** ADMIN — may delete any attachment; otherwise only uploader can delete */
  canDeleteAny?: boolean;
  /** ID of the authenticated user (needed for uploader-delete check) */
  currentUserId?: string;
}

export function TaskAttachments({
  taskId,
  enabled = true,
  canAdd = false,
  canDeleteAny = false,
  currentUserId = "",
}: TaskAttachmentsProps) {
  const { data, isLoading, isError } = useTaskAttachments(taskId, enabled);
  const attachments = data?.attachments ?? [];
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="border-t border-slate-200 p-5 dark:border-slate-800">
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Paperclip className="h-4 w-4 text-slate-400" />
          Attachments
          {attachments.length > 0 && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {attachments.length}
            </span>
          )}
        </h3>

        {canAdd && !showForm && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="h-7 gap-1 px-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>

      {/* Inline add form */}
      {showForm && (
        <AddAttachmentForm taskId={taskId} onClose={() => setShowForm(false)} />
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-rose-500">Could not load attachments.</p>
      ) : attachments.length === 0 ? (
        !showForm && (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No attachments yet.
          </div>
        )
      ) : (
        <div className="space-y-2">
          {attachments.map((a) => (
            <AttachmentRow
              key={a._id}
              attachment={a}
              taskId={taskId}
              currentUserId={currentUserId}
              canDeleteAny={canDeleteAny}
            />
          ))}
        </div>
      )}
    </section>
  );
}
