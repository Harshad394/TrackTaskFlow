import { z } from "zod";
import { paginationSchema } from "./pagination.validator.js";

export const searchUsersSchema = paginationSchema.extend({
  q: z.string().trim().min(2, "Search query must be at least 2 characters"),
});
