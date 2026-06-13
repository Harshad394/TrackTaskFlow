import { Response } from "express";
import mongoose from "mongoose";
import Sprint from "../models/sprint.model.js";
import Task from "../models/task.model.js";
import { ProjectAuthRequest } from "../middleware/projectPermission.middleware.js";
import {
  createSprintSchema,
  updateSprintSchema,
  backlogQuerySchema,
} from "../validators/sprint.validator.js";
import { buildPaginationMeta, getPaginationOptions } from "../utils/pagination.js";

// ─── POST /projects/:projectId/sprints ────────────────────────────────────────

export const createSprint = async (
  req: ProjectAuthRequest<{ projectId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId || !req.project) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = createSprintSchema.parse(req.body);

    // Warn if caller tries to create an ACTIVE sprint (field ignored, but guard active-sprint rule)
    const requestedStatus = (req.body as any).status as string | undefined;
    if (requestedStatus === "ACTIVE") {
      const activeSprint = await Sprint.findOne({
        project: req.params.projectId,
        status:  "ACTIVE",
      });
      if (activeSprint) {
        return res.status(409).json({
          message: "A sprint is already ACTIVE for this project. Complete it before starting a new one.",
          activeSprint,
        });
      }
    }

    const sprint = await Sprint.create({
      ...validatedData,
      project:   req.params.projectId,
      createdBy: req.user.userId,
    });

    return res.status(201).json({ sprint });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── GET /projects/:projectId/sprints ────────────────────────────────────────

export const listSprints = async (
  req: ProjectAuthRequest<{ projectId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Optional ?status filter
    const rawStatus = (req.query.status as string | undefined)?.toUpperCase();
    const allowedStatuses = ["PLANNED", "ACTIVE", "COMPLETED"];
    const statusFilter = rawStatus && allowedStatuses.includes(rawStatus)
      ? rawStatus
      : undefined;

    const query: Record<string, unknown> = { project: req.params.projectId };
    if (statusFilter) query.status = statusFilter;

    const sprints = await Sprint.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    // Attach task count to each sprint for dashboard convenience
    const sprintIds = sprints.map((s) => s._id);
    const taskCounts = await Task.aggregate([
      { $match: { sprint: { $in: sprintIds } } },
      { $group: { _id: "$sprint", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(taskCounts.map((t) => [t._id.toString(), t.count]));

    const data = sprints.map((s) => ({
      ...s.toObject(),
      taskCount: countMap.get(s._id.toString()) ?? 0,
    }));

    return res.status(200).json({ sprints: data });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── PATCH /sprints/:sprintId ────────────────────────────────────────────────

export const updateSprint = async (
  req: ProjectAuthRequest<{ sprintId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sprintId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sprintId)) {
      return res.status(400).json({ message: "Invalid sprint" });
    }

    const validatedData = updateSprintSchema.parse(req.body);

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    // Enforce membership via the sprint's project
    const projectId = sprint.project.toString();
    const project = req.project;   // set by requireSprintProjectRole middleware
    if (!project || project._id.toString() !== projectId) {
      return res.status(403).json({ message: "Project access denied" });
    }

    // Guard: activating a sprint when one is already active
    if (validatedData.status === "ACTIVE" && sprint.status !== "ACTIVE") {
      const existing = await Sprint.findOne({ project: projectId, status: "ACTIVE" });
      if (existing) {
        return res.status(409).json({
          message: "Another sprint is already ACTIVE. Complete it first.",
          activeSprint: existing,
        });
      }
    }

    // Guard: cannot revert a COMPLETED sprint back to ACTIVE/PLANNED
    if (sprint.status === "COMPLETED" && validatedData.status !== "COMPLETED") {
      return res.status(409).json({ message: "Completed sprints cannot be reopened" });
    }

    Object.assign(sprint, validatedData);
    await sprint.save();

    return res.status(200).json({ sprint });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── POST /sprints/:sprintId/tasks/:taskId ────────────────────────────────────

export const addTaskToSprint = async (
  req: ProjectAuthRequest<{ sprintId: string; taskId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sprintId, taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sprintId)) {
      return res.status(400).json({ message: "Invalid sprint" });
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task" });
    }

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Task must belong to the same project as the sprint
    if (task.project.toString() !== sprint.project.toString()) {
      return res.status(400).json({ message: "Task does not belong to this project" });
    }

    // Caller must be a member of the project
    const project = req.project;
    if (!project || project._id.toString() !== sprint.project.toString()) {
      return res.status(403).json({ message: "Project access denied" });
    }

    if (sprint.status === "COMPLETED") {
      return res.status(409).json({ message: "Cannot add tasks to a completed sprint" });
    }

    task.sprint = new mongoose.Types.ObjectId(sprintId);
    await task.save();

    return res.status(200).json({ message: "Task added to sprint", task });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── DELETE /sprints/:sprintId/tasks/:taskId ──────────────────────────────────

export const removeTaskFromSprint = async (
  req: ProjectAuthRequest<{ sprintId: string; taskId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sprintId, taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sprintId)) {
      return res.status(400).json({ message: "Invalid sprint" });
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task" });
    }

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Verify the task actually belongs to this sprint
    if (!task.sprint || task.sprint.toString() !== sprintId) {
      return res.status(400).json({ message: "Task is not in this sprint" });
    }

    // Caller must be a project member
    const project = req.project;
    if (!project || project._id.toString() !== sprint.project.toString()) {
      return res.status(403).json({ message: "Project access denied" });
    }

    task.sprint = undefined;
    await task.save();

    return res.status(200).json({ message: "Task moved to backlog", task });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── GET /projects/:projectId/backlog ─────────────────────────────────────────

export const getBacklog = async (
  req: ProjectAuthRequest<{ projectId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const filters = backlogQuerySchema.parse(req.query);
    const { skip, limit } = getPaginationOptions(filters.page, filters.limit);

    // Backlog = tasks that have no sprint assigned
    const query: Record<string, unknown> = {
      project: req.params.projectId,
      sprint:  { $exists: false },   // also catches sprint: null
    };

    if (filters.priority) query.priority = filters.priority;
    if (filters.type)     query.type     = filters.type;
    if (filters.assignee) {
      if (!mongoose.Types.ObjectId.isValid(filters.assignee)) {
        return res.status(400).json({ message: "Invalid assignee" });
      }
      query.assignee = filters.assignee;
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ order: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("section",  "name order")
        .populate("assignee", "name email")
        .populate("createdBy","name email"),
      Task.countDocuments(query),
    ]);

    return res.status(200).json({
      pagination: buildPaginationMeta({ page: filters.page, limit: filters.limit, total }),
      tasks,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};
