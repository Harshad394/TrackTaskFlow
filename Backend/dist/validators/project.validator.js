import { z } from "zod";
export const createProjectSchema = z.object({
    name: z
        .string()
        .min(2, "Project name must be at least 2 characters")
        .max(80, "Project name must not exceed 80 characters"),
    description: z
        .string()
        .max(500, "Description must not exceed 500 characters")
        .optional(),
    key: z
        .string()
        .min(2, "Project key must be at least 2 characters")
        .max(10, "Project key must not exceed 10 characters")
        .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "Project key must use letters and numbers only"),
});
export const updateProjectSchema = createProjectSchema
    .partial()
    .extend({
    status: z.enum(["ACTIVE", "ARCHIVED", "COMPLETED"]).optional(),
});
export const addProjectMemberSchema = z.object({
    userId: z.string().min(1, "User is required"),
    role: z.enum(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
});
export const updateProjectMemberSchema = z.object({
    role: z.enum(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
});
