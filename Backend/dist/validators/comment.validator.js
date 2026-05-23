import { z } from "zod";
export const createCommentSchema = z.object({
    body: z
        .string()
        .min(1, "Comment cannot be empty")
        .max(2000, "Comment must not exceed 2000 characters"),
});
export const updateCommentSchema = createCommentSchema.partial();
