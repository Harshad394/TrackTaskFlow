"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useCreateProject } from "../hooks/useCreateProject";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  key: z.string().min(2, "Key must be at least 2 characters").max(10).regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "Key must use letters and numbers only"),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

export function CreateProjectModal({ isOpen, onClose, orgId }: CreateProjectModalProps) {
  const mutation = useCreateProject();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(
      { orgId, data },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Project">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {mutation.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
            {/* @ts-ignore */}
            {mutation.error?.response?.data?.message || "Failed to create project."}
          </div>
        )}
        <Input
          id="name"
          label="Project Name"
          placeholder="e.g. Website Redesign"
          {...register("name")}
          error={errors.name?.message}
        />
        <Input
          id="key"
          label="Project Key"
          placeholder="e.g. WEB"
          {...register("key")}
          error={errors.key?.message}
        />
        <div className="w-full">
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Description (Optional)
          </label>
          <textarea
            id="description"
            className="flex w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-700 dark:text-slate-100"
            rows={3}
            {...register("description")}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
