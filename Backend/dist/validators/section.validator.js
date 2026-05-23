import { z } from "zod";
export const createSectionSchema = z.object({
    name: z
        .string()
        .min(2, "Section name must be at least 2 characters")
        .max(50, "Section name must not exceed 50 characters"),
    order: z.number().min(0).optional(),
});
export const updateSectionSchema = createSectionSchema.partial();
