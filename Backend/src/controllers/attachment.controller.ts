import { Response } from "express";
import mongoose from "mongoose";
import Activity    from "../models/activity.model.js";
import Attachment  from "../models/attachment.model.js";
import Project     from "../models/project.model.js";
import Task        from "../models/task.model.js";
import { Authrequest }        from "../middleware/auth.middleware.js";
import { ProjectAuthRequest } from "../middleware/projectPermission.middleware.js";
import { createAttachmentSchema } from "../validators/attachment.validator.js";
import { paginationSchema }       from "../validators/pagination.validator.js";
import { buildPaginationMeta, getPaginationOptions } from "../utils/pagination.js";

// ─── POST /tasks/:taskId/attachments ─────────────────────────────────────────

/**
 * Record attachment metadata for a task.
 * All project members except CLIENT can upload.
 * The actual file upload happens client-side (pre-signed URL or similar).
 */
export const createAttachment = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId || !req.task) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = createAttachmentSchema.parse(req.body);

    const attachment = await Attachment.create({
      ...validatedData,
      task:       req.task._id,
      project:    req.task.project,
      uploadedBy: req.user.userId,
    });

    await Activity.create({
      user:    req.user.userId,
      task:    req.task._id,
      action:  "updated",
      details: `Attachment added: ${validatedData.fileName}`,
    });

    return res.status(201).json({ attachment });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── GET /tasks/:taskId/attachments ──────────────────────────────────────────

/**
 * List all attachments for a task, paginated.
 * Accessible by all project members.
 */
export const listAttachments = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const pagination = paginationSchema.parse(req.query);
    const { skip, limit } = getPaginationOptions(pagination.page, pagination.limit);
    const query = { task: req.params.taskId };

    const [attachments, total] = await Promise.all([
      Attachment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "name email"),
      Attachment.countDocuments(query),
    ]);

    return res.status(200).json({
      pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total }),
      attachments,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── DELETE /attachments/:attachmentId ───────────────────────────────────────

/**
 * Delete attachment metadata.
 * Allowed: the uploader OR a project ADMIN.
 * Permission resolved by loading the task's project and checking membership.
 */
export const deleteAttachment = async (
  req: Authrequest<{ attachmentId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { attachmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
      return res.status(400).json({ message: "Invalid attachment" });
    }

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Resolve project membership so we can check ADMIN role
    const project = await Project.findById(attachment.project);
    const role = project?.members.find(
      (m) => m.userId.toString() === req.user!.userId
    )?.role;

    // Must be a project member to even see this attachment
    if (!role) {
      return res.status(403).json({ message: "Project access denied" });
    }

    const isUploader = attachment.uploadedBy.toString() === req.user.userId;
    const isAdmin    = role === "ADMIN";

    if (!isUploader && !isAdmin) {
      return res.status(403).json({
        message: "Only the uploader or a project ADMIN can delete attachments",
      });
    }

    // Fetch task for the activity log (best-effort; skip if task was deleted)
    const task = await Task.findById(attachment.task);

    await attachment.deleteOne();

    if (task) {
      await Activity.create({
        user:    req.user.userId,
        task:    task._id,
        action:  "updated",
        details: `Attachment removed: ${attachment.fileName}`,
      });
    }

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
