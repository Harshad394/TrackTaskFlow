"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";
import { BoardSection } from "../types";
import { getId } from "../utils";
import {
  useDeleteSection,
  useUpdateSection,
} from "../hooks/useSectionMutations";

interface SectionActionsMenuProps {
  section: BoardSection;
  projectId: string;
  taskCount: number;
}

export function SectionActionsMenu({
  section,
  projectId,
  taskCount,
}: SectionActionsMenuProps) {
  const sectionId = getId(section);
  const updateMutation = useUpdateSection(projectId);
  const deleteMutation = useDeleteSection(projectId);

  // ── Rename state ──────────────────────────────────────────────────────────
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(section.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = () => {
    setNameValue(section.name);
    setIsRenaming(true);
    // Focus after render
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setNameValue(section.name);
  };

  const commitRename = () => {
    const trimmed = nameValue.trim();
    if (trimmed.length < 2 || trimmed === section.name) {
      cancelRename();
      return;
    }
    updateMutation.mutate(
      { sectionId, data: { name: trimmed } },
      { onSuccess: () => setIsRenaming(false) }
    );
  };

  // ── Delete state ──────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = () => {
    setDeleteError(null);
    deleteMutation.mutate(
      { sectionId },
      {
        onError: (err: any) => {
          // Surface the backend message (e.g. "Section has tasks")
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Could not delete section.";
          setDeleteError(msg);
          setConfirmDelete(false);
        },
        onSuccess: () => setConfirmDelete(false),
      }
    );
  };

  // ── Rename mode ───────────────────────────────────────────────────────────
  if (isRenaming) {
    return (
      <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className={cn(
            "h-7 flex-1 rounded border border-blue-400 bg-white px-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
          )}
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") cancelRename();
          }}
          maxLength={50}
          autoFocus
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-emerald-600 hover:text-emerald-700"
          onClick={commitRename}
          isLoading={updateMutation.isPending}
          title="Save name"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          onClick={cancelRename}
          title="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  // ── Confirm-delete mode ───────────────────────────────────────────────────
  if (confirmDelete) {
    return (
      <div
        className="flex flex-1 items-center justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mr-1 text-xs text-slate-500">Delete section?</span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-rose-600 hover:text-rose-700"
          isLoading={deleteMutation.isPending}
          onClick={handleDelete}
          title="Confirm delete"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          onClick={() => setConfirmDelete(false)}
          title="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  // ── Normal action buttons ─────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      {deleteError && (
        <span className="mr-2 max-w-[10rem] truncate text-xs text-rose-500" title={deleteError}>
          {deleteError}
        </span>
      )}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        onClick={startRename}
        title="Rename section"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn(
          "h-7 w-7 shrink-0 text-slate-400",
          taskCount === 0
            ? "hover:text-rose-600 dark:hover:text-rose-400"
            : "cursor-not-allowed opacity-40"
        )}
        onClick={() => {
          if (taskCount > 0) {
            setDeleteError("Remove all tasks before deleting this section.");
            return;
          }
          setDeleteError(null);
          setConfirmDelete(true);
        }}
        title={
          taskCount > 0
            ? "Cannot delete — section has tasks"
            : "Delete section"
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
