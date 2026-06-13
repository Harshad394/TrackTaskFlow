"use client";

import { CheckCircle2, FolderGit2, Info } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useProject } from "../hooks/useProject";
import { useUpdateProject } from "../hooks/useUpdateProject";
import { ProjectStatus } from "../types";

interface ProjectDetailsSectionProps {
  projectId: string;
  isAdmin: boolean;
}

export function ProjectDetailsSection({ projectId, isAdmin }: ProjectDetailsSectionProps) {
  const { data: project, isLoading, isError, refetch } = useProject(projectId);
  const updateMutation = useUpdateProject(projectId);

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state when project data is loaded
  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setKey(project.key || "");
      setDescription(project.description || "");
      setStatus(project.status || "ACTIVE");
    }
  }, [project]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setValidationError(null);
    setSuccessMessage(null);

    // Validate key
    const trimmedKey = key.trim();
    if (trimmedKey.length < 2 || trimmedKey.length > 10) {
      setValidationError("Project key must be between 2 and 10 characters.");
      return;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(trimmedKey)) {
      setValidationError("Project key must start with a letter and use letters and numbers only.");
      return;
    }

    updateMutation.mutate(
      {
        name: name.trim(),
        key: trimmedKey.toUpperCase(),
        description: description.trim(),
        status,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Project details updated successfully.");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 animate-pulse space-y-4">
        <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="space-y-3">
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
        Project details could not be loaded.
        <Button className="ml-3" size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <FolderGit2 className="h-4 w-4" />
        Project Details
      </h2>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isAdmin || updateMutation.isPending}
            required
            maxLength={80}
          />

          <div>
            <Input
              label="Project Key"
              placeholder="e.g. PROJ"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={!isAdmin || updateMutation.isPending}
              required
              maxLength={10}
            />
            <p className="mt-1 text-xs text-slate-500">
              Short code used for task IDs (e.g. PROJ-101).
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Description
          </label>
          <textarea
            className="w-full min-h-[5rem] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isAdmin || updateMutation.isPending}
            maxLength={500}
          />
        </div>

        <div className="w-full md:w-1/2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Status
          </label>
          <select
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            disabled={!isAdmin || updateMutation.isPending}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>

        {validationError && (
          <div className="flex items-start gap-2 rounded bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/20 dark:text-rose-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {updateMutation.isError && (
          <div className="flex items-start gap-2 rounded bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/20 dark:text-rose-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {(updateMutation.error as any)?.response?.data?.message ||
                "Failed to update project details."}
            </span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2 rounded bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isAdmin && (
          <div className="flex justify-end">
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </section>
  );
}
