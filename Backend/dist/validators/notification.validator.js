import { z } from "zod";
export const notificationFilterSchema = z.object({
    unreadOnly: z.enum(["true", "false"]).optional(),
    type: z
        .enum(["task_assigned", "task_commented", "task_moved"])
        .optional(),
});
