import { Router } from "express";
import {
  createAttachment,
  listAttachments,
  deleteAttachment,
} from "../controllers/attachment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireTaskProjectRole } from "../middleware/projectPermission.middleware.js";

const router = Router();

// All project members can view attachments; CLIENTs included
router.get(
  "/tasks/:taskId/attachments",
  authMiddleware,
  requireTaskProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  listAttachments
);

// Only team members (not CLIENT) can add attachments
router.post(
  "/tasks/:taskId/attachments",
  authMiddleware,
  requireTaskProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  createAttachment
);

// Delete resolves its own permissions (uploader OR ADMIN) — plain authMiddleware is enough
router.delete(
  "/attachments/:attachmentId",
  authMiddleware,
  deleteAttachment
);

export default router;
