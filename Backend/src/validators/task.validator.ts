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

  status: z
    .enum(["todo", "in-progress", "done"])
    .optional(), // default handled by model

  priority: z
    .enum(["low", "medium", "high"])
    .optional(),

  dueDate: z
    .string()
    .optional(),
});


export const updateTaskSchema = createTaskSchema.partial();
