import { Response } from "express";
import mongoose from "mongoose";
import Activity from "../models/activity.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import { Authrequest }        from "../middleware/auth.middleware.js";
import { ProjectAuthRequest } from "../middleware/projectPermission.middleware.js";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../validators/comment.validator.js";
import { paginationSchema } from "../validators/pagination.validator.js";
import { buildPaginationMeta, getPaginationOptions } from "../utils/pagination.js";
import { logAuditEvent }    from "../services/audit.service.js";
import { resolveMentions }  from "../services/mention.service.js";

export const createTaskComment = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId || !req.task || !req.project) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = createCommentSchema.parse(req.body);

    // ── Resolve @mentions before creating the comment ─────────────────────────────
    const mentionedIds = await resolveMentions(
      validatedData.body,
      req.project,
      req.user.userId
    );

    const comment = await Comment.create({
      task:     req.task._id,
      project:  req.task.project,
      author:   req.user.userId,
      body:     validatedData.body,
      mentions: mentionedIds,
    });

    await Activity.create({
      user:   req.user.userId,
      task:   req.task._id,
      action: "commented",
      details: "Comment added",
    });

    // ── Notify assignee (existing behaviour) ────────────────────────────────────
    if (
      req.task.assignee &&
      req.task.assignee.toString() !== req.user.userId
    ) {
      await Notification.create({
        recipient: req.task.assignee,
        actor:     req.user.userId,
        project:   req.task.project,
        task:      req.task._id,
        type:      "task_commented",
        title:     "New comment",
        message:   `New comment on "${req.task.title}"`,
      });
    }

    // ── Notify mentioned project members ───────────────────────────────────────
    if (mentionedIds.length > 0) {
      // Skip any mentionee who is already the assignee (already notified above)
      const assigneeStr = req.task.assignee?.toString();
      const uniqueMentionees = mentionedIds.filter(
        (id) => id.toString() !== assigneeStr
      );

      await Promise.all(
        uniqueMentionees.map((recipientId) =>
          Notification.create({
            recipient: recipientId,
            actor:     req.user!.userId,
            project:   req.task!.project,
            task:      req.task!._id,
            type:      "task_comment_mention",
            title:     "You were mentioned",
            message:   `${req.user!.userId} mentioned you in a comment on "${req.task!.title}"`,
          })
        )
      );
    }

    // Audit
    void logAuditEvent({
      actorUserId: req.user.userId,
      projectId:   req.task.project.toString(),
      taskId:      req.task._id.toString(),
      action:      "comment:created",
      entityType:  "comment",
      entityId:    comment._id.toString(),
      metadata:    {
        taskTitle:   req.task.title,
        mentionCount: mentionedIds.length,
      },
    });

    // Return comment with mentions populated for immediate frontend use
    const populated = await comment.populate("mentions", "name email");

    return res.status(201).json({ comment: populated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listTaskComments = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    const pagination = paginationSchema.parse(req.query);
    const { skip, limit } = getPaginationOptions(pagination.page, pagination.limit);
    const query = { task: req.params.taskId };

    const [comments, total] = await Promise.all([
      Comment.find(query)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("author",   "name email")
        .populate("mentions", "name email"),
      Comment.countDocuments(query),
    ]);

    return res.status(200).json({
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
      comments,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateComment = async (
  req: Authrequest<{ commentId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid comment" });
    }

    const validatedData = updateCommentSchema.parse(req.body);

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const task = await Task.findById(comment.task);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    const role = project?.members.find(
      (member) => member.userId.toString() === req.user?.userId
    )?.role;
    const isAuthor = comment.author.toString() === req.user.userId;

    if (!isAuthor && role !== "ADMIN") {
      return res.status(403).json({ message: "Comment access denied" });
    }

    comment.set(validatedData);
    await comment.save();

    return res.status(200).json({ comment });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteComment = async (
  req: Authrequest<{ commentId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid comment" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const task = await Task.findById(comment.task);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    const role = project?.members.find(
      (member) => member.userId.toString() === req.user?.userId
    )?.role;
    const isAuthor = comment.author.toString() === req.user.userId;

    if (!isAuthor && role !== "ADMIN") {
      return res.status(403).json({ message: "Comment access denied" });
    }

    await comment.deleteOne();

    // Audit: comment deleted
    void logAuditEvent({
      actorUserId: req.user.userId,
      projectId:   task.project.toString(),
      taskId:      task._id.toString(),
      action:      "comment:deleted",
      entityType:  "comment",
      entityId:    comment._id.toString(),
      metadata:    { taskId: task._id.toString() },
    });

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
