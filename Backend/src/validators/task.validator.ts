import { z } from "zod";


export const createTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(255, "Title must not exceed 255 characters"),

  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),

  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional(),

  type: z
    .enum(["task", "bug", "feature"])
    .optional(),

  labels: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Label cannot be empty")
        .max(30, "Label must not exceed 30 characters")
        .regex(/^[a-zA-Z0-9-_ ]+$/, "Label can use letters, numbers, spaces, hyphens, and underscores")
    )
    .max(10, "Task can have up to 10 labels")
    .optional(),

  assignee: z
    .string()
    .optional(),

  order: z
    .number()
    .min(0)
    .optional(),

  dueDate: z
    .string()
    .optional(),
});


export const updateTaskSchema = createTaskSchema.partial().extend({
  section: z.string().optional(),
});

export const moveTaskSchema = z.object({
  section: z.string().min(1, "Section is required"),
  order: z.number().min(0, "Order must be zero or greater"),
});

export const taskFilterSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  assignee: z.string().trim().min(1).optional(),
  createdBy: z.string().trim().min(1).optional(),
  section: z.string().trim().min(1).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  type: z.enum(["task", "bug", "feature"]).optional(),
  labels: z.union([z.string().trim().min(1), z.array(z.string().trim().min(1))]).optional(),
  dueFrom: z.string().trim().min(1).optional(),
  dueTo: z.string().trim().min(1).optional(),
});
