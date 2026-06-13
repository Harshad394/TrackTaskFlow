import { z } from "zod";
import { paginationSchema } from "./pagination.validator.js";

export const notificationFilterSchema = paginationSchema.extend({
  unreadOnly: z.enum(["true", "false"]).optional(),
  type: z
    .enum(["task_assigned", "task_commented", "task_moved"])
    .optional(),
});
