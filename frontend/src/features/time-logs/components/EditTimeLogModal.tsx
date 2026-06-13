"use client";

import { X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useDeleteTimeLog } from "../hooks/useDeleteTimeLog";
import { useUpdateTimeLog } from "../hooks/useUpdateTimeLog";
import { TimeLog } from "../types";
import { getTimeLogId } from "../utils";

interface EditTimeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeLog: TimeLog | null;
  projectId: string;
  taskId?: string;
}

export function EditTimeLogModal({
  isOpen,
  onClose,
  timeLog,
  projectId,
  taskId,
}: EditTimeLogModalProps) {
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [billable, setBillable] = useState(true);
  const [loggedAt, setLoggedAt] = useState("");

  const updateMutation = useUpdateTimeLog(projectId, taskId);
  const deleteMutation = useDeleteTimeLog(projectId, taskId);

  useEffect(() => {
    if (timeLog) {
      setMinutes(String(timeLog.minutes));
      setNote(timeLog.note || "");
      setBillable(timeLog.billable);
      if (timeLog.loggedAt) {
        try {
          setLoggedAt(new Date(timeLog.loggedAt).toISOString().split("T")[0]);
        } catch {
          setLoggedAt("");
        }
      } else {
        setLoggedAt("");
      }
    }
  }, [timeLog]);

  if (!isOpen || !timeLog) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedMinutes = Number(minutes);
    if (!Number.isInteger(parsedMinutes) || parsedMinutes < 1 || parsedMinutes > 1440) {
      return;
    }

    const timeLogId = getTimeLogId(timeLog);
    updateMutation.mutate(
      {
        timeLogId,
        data: {
          minutes: parsedMinutes,
          note: note.trim() || undefined,
          billable,
          loggedAt: loggedAt ? new Date(loggedAt).toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this time log?")) {
      return;
    }
    const timeLogId = getTimeLogId(timeLog);
    deleteMutation.mutate(timeLogId, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Edit Time Log
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Minutes"
              type="number"
              min={1}
              max={1440}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Date Logged
              </label>
              <input
                type="date"
                className="h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-700 dark:text-slate-100"
                value={loggedAt}
                onChange={(e) => setLoggedAt(e.target.value)}
                required
              />
            </div>
          </div>

          <Input
            label="Note"
            placeholder="Worked on API wiring"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
            />
            Billable
          </label>

          {updateMutation.isError && (
            <p className="text-sm text-rose-600">
              {(updateMutation.error as any)?.response?.data?.message ||
                "Failed to update time log."}
            </p>
          )}

          {deleteMutation.isError && (
            <p className="text-sm text-rose-600">
              {(deleteMutation.error as any)?.response?.data?.message ||
                "Failed to delete time log."}
            </p>
          )}

          <div className="flex justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/20"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
