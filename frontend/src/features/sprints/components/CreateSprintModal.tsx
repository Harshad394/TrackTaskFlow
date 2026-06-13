"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useCreateSprint } from "../hooks/useSprintMutations";

interface CreateSprintModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSprintModal({
  projectId,
  isOpen,
  onClose,
}: CreateSprintModalProps) {
  const createSprint = useCreateSprint(projectId);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Sprint name must be at least 2 characters");
      return;
    }

    let isoStart: string | undefined;
    let isoEnd: string | undefined;

    if (startDate) {
      isoStart = new Date(startDate).toISOString();
    }
    if (endDate) {
      isoEnd = new Date(endDate).toISOString();
    }

    if (isoStart && isoEnd && new Date(isoEnd) <= new Date(isoStart)) {
      setError("End date must be after start date");
      return;
    }

    createSprint.mutate(
      {
        name: trimmedName,
        goal: goal.trim() || undefined,
        startDate: isoStart,
        endDate: isoEnd,
      },
      {
        onSuccess: () => {
          setName("");
          setGoal("");
          setStartDate("");
          setEndDate("");
          onClose();
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message || "Failed to create sprint");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <button
          type="button"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
          Create Sprint
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Sprint Name *
            </label>
            <input
              type="text"
              required
              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-slate-100"
              placeholder="e.g. Sprint 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Goal
            </label>
            <textarea
              className="w-full min-h-[60px] rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-slate-100"
              placeholder="What are we trying to achieve?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-slate-100"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-slate-100"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSprint.isPending}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
