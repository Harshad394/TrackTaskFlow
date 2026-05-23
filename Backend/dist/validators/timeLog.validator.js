import { z } from "zod";
export const createTimeLogSchema = z.object({
    minutes: z
        .number()
        .int("Minutes must be a whole number")
        .min(1, "Minutes must be at least 1")
        .max(1440, "Minutes cannot exceed 24 hours"),
    note: z.string().trim().max(500, "Note must not exceed 500 characters").optional(),
    billable: z.boolean().optional(),
    loggedAt: z.string().trim().min(1).optional(),
});
export const updateTimeLogSchema = createTimeLogSchema.partial();
export const timeLogFilterSchema = z.object({
    user: z.string().trim().min(1).optional(),
    task: z.string().trim().min(1).optional(),
    billable: z.enum(["true", "false"]).optional(),
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
});
