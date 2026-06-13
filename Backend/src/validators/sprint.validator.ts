import { z } from "zod";
import { paginationSchema } from "./pagination.validator.js";

// ─── Sprint schemas ───────────────────────────────────────────────────────────

export const createSprintSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Sprint name must be at least 2 characters")
    .max(120, "Sprint name must not exceed 120 characters"),

  goal: z
    .string()
    .trim()
    .max(500, "Goal must not exceed 500 characters")
    .optional(),

  startDate: z
    .string()
    .datetime({ message: "startDate must be a valid ISO 8601 date-time" })
    .optional(),

  endDate: z
    .string()
    .datetime({ message: "endDate must be a valid ISO 8601 date-time" })
    .optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  { message: "endDate must be after startDate", path: ["endDate"] }
);

export const updateSprintSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Sprint name must be at least 2 characters")
    .max(120, "Sprint name must not exceed 120 characters")
    .optional(),

  goal: z
    .string()
    .trim()
    .max(500, "Goal must not exceed 500 characters")
    .optional(),

  status: z
    .enum(["PLANNED", "ACTIVE", "COMPLETED"])
    .optional(),

  startDate: z
    .string()
    .datetime({ message: "startDate must be a valid ISO 8601 date-time" })
    .optional(),

  endDate: z
    .string()
    .datetime({ message: "endDate must be a valid ISO 8601 date-time" })
    .optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  { message: "endDate must be after startDate", path: ["endDate"] }
);

// ─── Backlog filter / pagination ──────────────────────────────────────────────

export const backlogQuerySchema = paginationSchema.extend({
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  type:     z.enum(["task", "bug", "feature"]).optional(),
  assignee: z.string().trim().min(1).optional(),
});
