import { Response } from "express";
import mongoose from "mongoose";
import Activity from "../models/activity.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import Section from "../models/section.model.js";
import Task from "../models/task.model.js";
import TimeLog from "../models/timeLog.model.js";
import {
  createTaskSchema,
  moveTaskSchema,
  taskFilterSchema,
  updateTaskSchema,
  requestApprovalSchema,
  approveTaskSchema,
  rejectTaskSchema,
} from "../validators/task.validator.js";
import { ProjectAuthRequest } from "../middleware/projectPermission.middleware.js";
import { paginationSchema } from "../validators/pagination.validator.js";
import { buildPaginationMeta, getPaginationOptions } from "../utils/pagination.js";
import {
  boardCacheKey,
  cacheGet,
  cacheSet,
  invalidateBoardCache,
  BOARD_CACHE_TTL,
} from "../services/cache.service.js";
import { logAuditEvent } from "../services/audit.service.js";

const isProjectMember = (
  project: ProjectAuthRequest["project"],
  userId?: string
) => {
  return Boolean(
    userId && project?.members.some((member) => member.userId.toString() === userId)
  );
};

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const parseDate = (value: string, fieldName: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return date;
};

const createTaskNotification = async ({
  recipient,
  actor,
  project,
  task,
  type,
  title,
  message,
}: {
  recipient?: string | mongoose.Types.ObjectId;
  actor?: string | mongoose.Types.ObjectId;
  project: string | mongoose.Types.ObjectId;
  task: string | mongoose.Types.ObjectId;
  type: "task_assigned" | "task_moved";
  title: string;
  message: string;
}) => {
  if (!recipient || !actor || recipient.toString() === actor.toString()) {
    return;
  }

  await Notification.create({
    recipient,
    actor,
    project,
    task,
    type,
    title,
    message,
  });
};

export const createSectionTask = async (
  req: ProjectAuthRequest<{ sectionId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId || !req.section) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = createTaskSchema.parse(req.body);

    if (
      validatedData.assignee &&
      !mongoose.Types.ObjectId.isValid(validatedData.assignee)
    ) {
      return res.status(400).json({ message: "Invalid assignee" });
    }

    if (validatedData.assignee && !isProjectMember(req.project, validatedData.assignee)) {
      return res.status(400).json({ message: "Assignee is not a project member" });
    }

    if (
      validatedData.assignee &&
      req.projectRole !== "ADMIN" &&
      validatedData.assignee !== req.user.userId
    ) {
      return res.status(403).json({ message: "Only project admins can assign tasks to others" });
    }

    const nextOrder =
      validatedData.order ??
      (await Task.countDocuments({ section: req.params.sectionId }));

    const task = await Task.create({
      ...validatedData,
      order: nextOrder,
      section: req.params.sectionId,
      project: req.section.project,
      createdBy: req.user.userId,
    });

    await Activity.create({
      user: req.user.userId,
      task: task._id,
      action: "created",
      details: "Task created",
    });

    await createTaskNotification({
      recipient: task.assignee,
      actor: req.user.userId,
      project: task.project,
      task: task._id,
      type: "task_assigned",
      title: "Task assigned",
      message: `You were assigned to "${task.title}"`,
    });

    // Invalidate board cache – a new task changes column content
    await invalidateBoardCache(task.project.toString());

    // Audit: task created
    void logAuditEvent({
      actorUserId: req.user.userId,
      projectId:   task.project.toString(),
      taskId:      task._id.toString(),
      action:      "task:created",
      entityType:  "task",
      entityId:    task._id.toString(),
      metadata:    { title: task.title, sectionId: req.params.sectionId },
    });

    return res.status(201).json({ message: "Task created successfully", task });
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

export const listProjectTasks = async (
  req: ProjectAuthRequest<{ projectId: string }>,
  res: Response
) => {
  try {
    const filters = taskFilterSchema.parse(req.query);
    const query: Record<string, any> = { project: req.params.projectId };

    if (filters.q) {
      const searchRegex = new RegExp(escapeRegex(filters.q), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.labels) {
      const labels = Array.isArray(filters.labels) ? filters.labels : [filters.labels];
      query.labels = { $all: labels.map((label) => label.trim()) };
    }

    if (filters.assignee) {
      if (!mongoose.Types.ObjectId.isValid(filters.assignee)) {
        return res.status(400).json({ message: "Invalid assignee" });
      }

      if (!isProjectMember(req.project, filters.assignee)) {
        return res.status(400).json({ message: "Assignee is not a project member" });
      }

      query.assignee = filters.assignee;
    }

    if (filters.createdBy) {
      if (!mongoose.Types.ObjectId.isValid(filters.createdBy)) {
        return res.status(400).json({ message: "Invalid creator" });
      }

      if (!isProjectMember(req.project, filters.createdBy)) {
        return res.status(400).json({ message: "Creator is not a project member" });
      }

      query.createdBy = filters.createdBy;
    }

    if (filters.section) {
      if (!mongoose.Types.ObjectId.isValid(filters.section)) {
        return res.status(400).json({ message: "Invalid section" });
      }

      const section = await Section.findOne({
        _id: filters.section,
        project: req.params.projectId,
      });

      if (!section) {
        return res.status(400).json({ message: "Section does not belong to this project" });
      }

      query.section = filters.section;
    }

    if (filters.dueFrom || filters.dueTo) {
      query.dueDate = {};

      if (filters.dueFrom) {
        query.dueDate.$gte = parseDate(filters.dueFrom, "dueFrom");
      }

      if (filters.dueTo) {
        query.dueDate.$lte = parseDate(filters.dueTo, "dueTo");
      }
    }

    const { skip, limit } = getPaginationOptions(filters.page, filters.limit);
    const [tasks, total] = await Promise.all([
      Task.find(query)
      .sort({ section: 1, order: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
      .populate("section", "name order")
      .populate("assignee", "name email")
        .populate("createdBy", "name email"),
      Task.countDocuments(query),
    ]);

    return res.status(200).json({
      count: tasks.length,
      filters,
      pagination: buildPaginationMeta({
        page: filters.page,
        limit: filters.limit,
        total,
      }),
      tasks,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    if (error.message?.startsWith("Invalid due")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listSectionTasks = async (
  req: ProjectAuthRequest<{ sectionId: string }>,
  res: Response
) => {
  try {
    const pagination = paginationSchema.parse(req.query);
    const { skip, limit } = getPaginationOptions(pagination.page, pagination.limit);
    const query = { section: req.params.sectionId };

    const [tasks, total] = await Promise.all([
      Task.find(query)
      .sort({ order: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
      .populate("assignee", "name email")
        .populate("createdBy", "name email"),
      Task.countDocuments(query),
    ]);

    return res.status(200).json({
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
      tasks,
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

export const getProjectBoard = async (
  req: ProjectAuthRequest<{ projectId: string }>,
  res: Response
) => {
  try {
    const { projectId } = req.params;
    const cacheKey = boardCacheKey(projectId);

    // ── Cache read ──────────────────────────────────────────────────────────
    const cached = await cacheGet<{ board: unknown[] }>(cacheKey);
    if (cached !== null) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cached);
    }

    // ── DB query ────────────────────────────────────────────────────────────
    const sections = await Section.find({ project: projectId }).sort({
      order: 1,
      createdAt: 1,
    });

    const tasks = await Task.find({ project: projectId })
      .sort({ section: 1, order: 1, createdAt: 1 })
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    const board = sections.map((section) => ({
      section,
      tasks: tasks.filter((task) => task.section.toString() === section._id.toString()),
    }));

    const payload = { board };

    // ── Cache write (fire-and-forget; never blocks the response) ────────────
    await cacheSet(cacheKey, payload, BOARD_CACHE_TTL);
    res.setHeader("X-Cache", "MISS");

    return res.status(200).json(payload);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTask = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate("section", "name order")
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ task });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTask = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    const validatedData = updateTaskSchema.parse(req.body);

    if (
      validatedData.assignee &&
      !mongoose.Types.ObjectId.isValid(validatedData.assignee)
    ) {
      return res.status(400).json({ message: "Invalid assignee" });
    }

    if (validatedData.assignee && !isProjectMember(req.project, validatedData.assignee)) {
      return res.status(400).json({ message: "Assignee is not a project member" });
    }

    if (validatedData.section) {
      if (!mongoose.Types.ObjectId.isValid(validatedData.section)) {
        return res.status(400).json({ message: "Invalid section" });
      }

      const targetSection = await Section.findOne({
        _id: validatedData.section,
        project: req.project?._id,
      });

      if (!targetSection) {
        return res.status(400).json({ message: "Section does not belong to this project" });
      }
    }

    const existingTask = await Task.findById(req.params.taskId);

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const previousAssignee = existingTask.assignee?.toString();

    if (
      Object.prototype.hasOwnProperty.call(validatedData, "assignee") &&
      req.projectRole !== "ADMIN" &&
      validatedData.assignee !== req.user?.userId
    ) {
      return res.status(403).json({ message: "Only project admins can assign tasks to others" });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $set: validatedData },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Activity.create({
      user: req.user?.userId,
      task: task._id,
      action: "updated",
      details: "Task updated",
    });

    if (validatedData.assignee && validatedData.assignee !== previousAssignee) {
      await createTaskNotification({
        recipient: task.assignee,
        actor: req.user?.userId,
        project: task.project,
        task: task._id,
        type: "task_assigned",
        title: "Task assigned",
        message: `You were assigned to "${task.title}"`,
      });
    }

    // Invalidate board cache – task fields visible on the board changed
    await invalidateBoardCache(task.project.toString());

    // Audit: task updated
    void logAuditEvent({
      actorUserId: req.user?.userId ?? "",
      projectId:   task.project.toString(),
      taskId:      task._id.toString(),
      action:      "task:updated",
      entityType:  "task",
      entityId:    task._id.toString(),
      metadata:    { changes: validatedData },
    });

    return res.status(200).json({ task });
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

export const deleteTask = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Promise.all([
      Comment.deleteMany({ task: task._id }),
      Activity.deleteMany({ task: task._id }),
      TimeLog.deleteMany({ task: task._id }),
      Notification.deleteMany({ task: task._id }),
    ]);

    // Invalidate board cache – task no longer exists
    await invalidateBoardCache(task.project.toString());

    // Audit: task deleted
    void logAuditEvent({
      actorUserId: req.user?.userId ?? "",
      projectId:   task.project.toString(),
      taskId:      task._id.toString(),
      action:      "task:deleted",
      entityType:  "task",
      entityId:    task._id.toString(),
      metadata:    { title: task.title },
    });

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const moveTask = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId || !req.task || !req.project) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = moveTaskSchema.parse(req.body);

    if (!mongoose.Types.ObjectId.isValid(validatedData.section)) {
      return res.status(400).json({ message: "Invalid section" });
    }

    const targetSection = await Section.findOne({
      _id: validatedData.section,
      project: req.project._id,
    });

    if (!targetSection) {
      return res.status(400).json({ message: "Section does not belong to this project" });
    }

    const sourceSectionId = req.task.section.toString();
    const targetSectionId = targetSection._id.toString();
    const affectedSectionIds = Array.from(new Set([sourceSectionId, targetSectionId]));

    const affectedTasks = await Task.find({
      project: req.project._id,
      section: { $in: affectedSectionIds },
      _id: { $ne: req.task._id },
    }).sort({ order: 1, createdAt: 1 });

    const sourceTasks = affectedTasks.filter((task) => {
      return task.section.toString() === sourceSectionId;
    });
    const targetTasks =
      sourceSectionId === targetSectionId
        ? [...sourceTasks]
        : affectedTasks.filter((task) => task.section.toString() === targetSectionId);

    const insertAt = Math.min(validatedData.order, targetTasks.length);
    targetTasks.splice(insertAt, 0, req.task as any);

    const sourceUpdates =
      sourceSectionId === targetSectionId
        ? []
        : sourceTasks.map((task, index) => ({
            updateOne: {
              filter: { _id: task._id },
              update: { $set: { order: index, section: req.task?.section } },
            },
          }));

    const targetUpdates = targetTasks.map((task, index) => ({
      updateOne: {
        filter: { _id: task._id },
        update: { $set: { order: index, section: targetSection._id } },
      },
    }));

    const updates = [...sourceUpdates, ...targetUpdates];

    if (updates.length > 0) {
      await Task.bulkWrite(updates);
    }

    const movedTask = await Task.findById(req.task._id)
      .populate("section", "name order")
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    await Activity.create({
      user: req.user.userId,
      task: req.task._id,
      action: "moved",
      details: `Task moved to ${targetSection.name}`,
    });

    await createTaskNotification({
      recipient: req.task.assignee,
      actor: req.user.userId,
      project: req.task.project,
      task: req.task._id,
      type: "task_moved",
      title: "Task moved",
      message: `"${req.task.title}" moved to ${targetSection.name}`,
    });

    // Invalidate board cache – task positions across columns changed
    await invalidateBoardCache(req.task.project.toString());

    // Audit: task moved between sections
    void logAuditEvent({
      actorUserId: req.user.userId,
      projectId:   req.task.project.toString(),
      taskId:      req.task._id.toString(),
      action:      "task:moved",
      entityType:  "task",
      entityId:    req.task._id.toString(),
      metadata:    {
        fromSectionId: sourceSectionId,
        toSectionId:   targetSectionId,
        toSectionName: targetSection.name,
        newOrder:      validatedData.order,
      },
    });

    return res.status(200).json({ task: movedTask });
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

export const listTaskActivities = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    const pagination = paginationSchema.parse(req.query);
    const { skip, limit } = getPaginationOptions(pagination.page, pagination.limit);
    const query = { task: req.params.taskId };

    const [activities, total] = await Promise.all([
      Activity.find(query)
      .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email"),
      Activity.countDocuments(query),
    ]);

    return res.status(200).json({
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
      activities,
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

export const getProjectTaskStats = async (
  req: ProjectAuthRequest<{ projectId: string }>,
  res: Response
) => {
  try {
    const stats = await Task.aggregate([
      {
        $match: { project: new mongoose.Types.ObjectId(req.params.projectId) },
      },
      {
        $group: {
          _id: "$section",
          count: { $sum: 1 },
        },
      },
    ]);

    const sections = await Section.find({ project: req.params.projectId }).sort({
      order: 1,
      createdAt: 1,
    });

    const sectionCounts = sections.map((section) => ({
      section,
      count: stats.find((stat) => stat._id.toString() === section._id.toString())?.count || 0,
    }));

    return res.status(200).json({
      total: stats.reduce((acc, cur) => acc + cur.count, 0),
      sectionCounts,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Approval flow handlers ───────────────────────────────────────────────────

/**
 * PATCH /tasks/:taskId/request-approval
 * Allowed roles: ADMIN, DEVELOPER, QA
 * Marks a task as PENDING so CLIENT users can review it.
 * Guards: task must not already be APPROVED or currently PENDING.
 */
export const requestApproval = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId || !req.task || !req.project) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    requestApprovalSchema.parse(req.body);

    const { task, project } = req;

    if (task.approvalStatus === "APPROVED") {
      return res.status(409).json({ message: "Task is already approved" });
    }

    if (task.approvalStatus === "PENDING") {
      return res.status(409).json({ message: "Approval has already been requested" });
    }

    task.approvalStatus = "PENDING";
    task.approvedBy     = undefined;
    task.approvedAt     = undefined;
    task.rejectionReason = undefined;
    await task.save();

    await Activity.create({
      user:    req.user.userId,
      task:    task._id,
      action:  "approval_requested",
      details: "Approval requested",
    });

    // Notify every CLIENT in the project
    const clientIds = project.members
      .filter((m) => m.role === "CLIENT" && m.userId.toString() !== req.user!.userId)
      .map((m) => m.userId);

    await Promise.all(
      clientIds.map((clientId) =>
        Notification.create({
          recipient: clientId,
          actor:     req.user!.userId,
          project:   task.project,
          task:      task._id,
          type:      "task_approval_requested",
          title:     "Approval requested",
          message:   `"${task.title}" is ready for your review`,
        })
      )
    );

    // Invalidate board cache – approvalStatus is visible on board cards
    await invalidateBoardCache(task.project.toString());

    void logAuditEvent({
      actorUserId: req.user.userId,
      projectId:   task.project.toString(),
      taskId:      task._id.toString(),
      action:      "task:updated",
      entityType:  "task",
      entityId:    task._id.toString(),
      metadata:    { approvalStatus: "PENDING" },
    });

    return res.status(200).json({ message: "Approval requested", task });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PATCH /tasks/:taskId/approve
 * Allowed roles: CLIENT (own approval), ADMIN (override)
 * Marks a task as APPROVED and stamps approvedBy + approvedAt.
 */
export const approveTask = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId || !req.task || !req.project) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    approveTaskSchema.parse(req.body);

    const { task, project } = req;
    const isAdmin  = req.projectRole === "ADMIN";
    const isClient = req.projectRole === "CLIENT";

    if (!isAdmin && !isClient) {
      return res.status(403).json({ message: "Only CLIENT or ADMIN can approve tasks" });
    }

    // CLIENTs can only approve tasks that have been submitted for review
    if (isClient && task.approvalStatus !== "PENDING") {
      return res.status(409).json({
        message: "Task must be in PENDING status before it can be approved",
      });
    }

    task.approvalStatus  = "APPROVED";
    task.approvedBy      = new mongoose.Types.ObjectId(req.user.userId);
    task.approvedAt      = new Date();
    task.rejectionReason = undefined;
    await task.save();

    await Activity.create({
      user:    req.user.userId,
      task:    task._id,
      action:  "approved",
      details: isAdmin ? "Approved by admin" : "Approved by client",
    });

    // Notify the task creator (and assignee if different)
    const notifyIds = Array.from(
      new Set(
        [task.createdBy?.toString(), task.assignee?.toString()]
          .filter((id): id is string => Boolean(id) && id !== req.user!.userId)
      )
    );

    await Promise.all(
      notifyIds.map((recipientId) =>
        Notification.create({
          recipient: recipientId,
          actor:     req.user!.userId,
          project:   task.project,
          task:      task._id,
          type:      "task_approved",
          title:     "Task approved",
          message:   `"${task.title}" was approved`,
        })
      )
    );

    await invalidateBoardCache(task.project.toString());

    void logAuditEvent({
      actorUserId: req.user.userId,
      projectId:   task.project.toString(),
      taskId:      task._id.toString(),
      action:      "task:updated",
      entityType:  "task",
      entityId:    task._id.toString(),
      metadata:    { approvalStatus: "APPROVED", override: isAdmin },
    });

    return res.status(200).json({ message: "Task approved", task });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PATCH /tasks/:taskId/reject
 * Allowed roles: CLIENT (own rejection), ADMIN (override)
 * Marks a task as REJECTED and records the rejectionReason.
 */
export const rejectTask = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId || !req.task || !req.project) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { rejectionReason } = rejectTaskSchema.parse(req.body);

    const { task } = req;
    const isAdmin  = req.projectRole === "ADMIN";
    const isClient = req.projectRole === "CLIENT";

    if (!isAdmin && !isClient) {
      return res.status(403).json({ message: "Only CLIENT or ADMIN can reject tasks" });
    }

    // CLIENTs can only reject tasks that are in PENDING status
    if (isClient && task.approvalStatus !== "PENDING") {
      return res.status(409).json({
        message: "Task must be in PENDING status before it can be rejected",
      });
    }

    task.approvalStatus  = "REJECTED";
    task.rejectionReason = rejectionReason;
    task.approvedBy      = undefined;
    task.approvedAt      = undefined;
    await task.save();

    await Activity.create({
      user:    req.user.userId,
      task:    task._id,
      action:  "rejected",
      details: `Rejected: ${rejectionReason}`,
    });

    // Notify the task creator (and assignee if different)
    const notifyIds = Array.from(
      new Set(
        [task.createdBy?.toString(), task.assignee?.toString()]
          .filter((id): id is string => Boolean(id) && id !== req.user!.userId)
      )
    );

    await Promise.all(
      notifyIds.map((recipientId) =>
        Notification.create({
          recipient: recipientId,
          actor:     req.user!.userId,
          project:   task.project,
          task:      task._id,
          type:      "task_rejected",
          title:     "Task rejected",
          message:   `"${task.title}" was rejected: ${rejectionReason}`,
        })
      )
    );

    await invalidateBoardCache(task.project.toString());

    void logAuditEvent({
      actorUserId: req.user.userId,
      projectId:   task.project.toString(),
      taskId:      task._id.toString(),
      action:      "task:updated",
      entityType:  "task",
      entityId:    task._id.toString(),
      metadata:    { approvalStatus: "REJECTED", rejectionReason, override: isAdmin },
    });

    return res.status(200).json({ message: "Task rejected", task });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};
