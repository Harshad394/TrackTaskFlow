import { Response } from "express";
import mongoose from "mongoose";
import Activity from "../models/activity.model.js";
import Project from "../models/project.model.js";
import TimeLog from "../models/timeLog.model.js";
import { Authrequest } from "../middleware/auth.middleware.js";
import { ProjectAuthRequest } from "../middleware/projectPermission.middleware.js";
import {
  createTimeLogSchema,
  timeLogFilterSchema,
  updateTimeLogSchema,
} from "../validators/timeLog.validator.js";

const parseDate = (value: string, fieldName: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return date;
};

export const createTaskTimeLog = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId || !req.task) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = createTimeLogSchema.parse(req.body);
    const loggedAt = validatedData.loggedAt
      ? parseDate(validatedData.loggedAt, "loggedAt")
      : new Date();

    const timeLog = await TimeLog.create({
      task: req.task._id,
      project: req.task.project,
      user: req.user.userId,
      minutes: validatedData.minutes,
      note: validatedData.note,
      billable: validatedData.billable ?? true,
      loggedAt,
    });

    await Activity.create({
      user: req.user.userId,
      task: req.task._id,
      action: "time_logged",
      details: `${validatedData.minutes} minutes logged`,
    });

    return res.status(201).json({ timeLog });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    if (error.message?.startsWith("Invalid")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listTaskTimeLogs = async (
  req: ProjectAuthRequest<{ taskId: string }>,
  res: Response
) => {
  try {
    const timeLogs = await TimeLog.find({ task: req.params.taskId })
      .sort({ loggedAt: -1, createdAt: -1 })
      .populate("user", "name email");

    const totalMinutes = timeLogs.reduce((total, log) => total + log.minutes, 0);
    const billableMinutes = timeLogs.reduce((total, log) => {
      return log.billable ? total + log.minutes : total;
    }, 0);

    return res.status(200).json({ totalMinutes, billableMinutes, timeLogs });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listProjectTimeLogs = async (
  req: ProjectAuthRequest<{ projectId: string }>,
  res: Response
) => {
  try {
    const filters = timeLogFilterSchema.parse(req.query);
    const query: Record<string, any> = { project: req.params.projectId };

    if (filters.user) {
      if (!mongoose.Types.ObjectId.isValid(filters.user)) {
        return res.status(400).json({ message: "Invalid user" });
      }

      const isMember = req.project?.members.some((member) => {
        return member.userId.toString() === filters.user;
      });

      if (!isMember) {
        return res.status(400).json({ message: "User is not a project member" });
      }

      query.user = filters.user;
    }

    if (filters.task) {
      if (!mongoose.Types.ObjectId.isValid(filters.task)) {
        return res.status(400).json({ message: "Invalid task" });
      }

      query.task = filters.task;
    }

    if (filters.billable) {
      query.billable = filters.billable === "true";
    }

    if (filters.from || filters.to) {
      query.loggedAt = {};

      if (filters.from) {
        query.loggedAt.$gte = parseDate(filters.from, "from");
      }

      if (filters.to) {
        query.loggedAt.$lte = parseDate(filters.to, "to");
      }
    }

    const timeLogs = await TimeLog.find(query)
      .sort({ loggedAt: -1, createdAt: -1 })
      .populate("user", "name email")
      .populate("task", "title priority type");

    const totalMinutes = timeLogs.reduce((total, log) => total + log.minutes, 0);
    const billableMinutes = timeLogs.reduce((total, log) => {
      return log.billable ? total + log.minutes : total;
    }, 0);

    return res.status(200).json({
      totalMinutes,
      billableMinutes,
      count: timeLogs.length,
      filters,
      timeLogs,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    if (error.message?.startsWith("Invalid")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTimeLog = async (
  req: Authrequest<{ timeLogId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.timeLogId)) {
      return res.status(400).json({ message: "Invalid time log" });
    }

    const validatedData = updateTimeLogSchema.parse(req.body);
    const timeLog = await TimeLog.findById(req.params.timeLogId);

    if (!timeLog) {
      return res.status(404).json({ message: "Time log not found" });
    }

    const project = await Project.findById(timeLog.project);
    const role = project?.members.find((member) => {
      return member.userId.toString() === req.user?.userId;
    })?.role;
    const isOwner = timeLog.user.toString() === req.user.userId;

    if (!isOwner && role !== "ADMIN") {
      return res.status(403).json({ message: "Time log access denied" });
    }

    timeLog.set({
      ...validatedData,
      loggedAt: validatedData.loggedAt
        ? parseDate(validatedData.loggedAt, "loggedAt")
        : timeLog.loggedAt,
    });
    await timeLog.save();

    return res.status(200).json({ timeLog });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    if (error.message?.startsWith("Invalid")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteTimeLog = async (
  req: Authrequest<{ timeLogId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.timeLogId)) {
      return res.status(400).json({ message: "Invalid time log" });
    }

    const timeLog = await TimeLog.findById(req.params.timeLogId);

    if (!timeLog) {
      return res.status(404).json({ message: "Time log not found" });
    }

    const project = await Project.findById(timeLog.project);
    const role = project?.members.find((member) => {
      return member.userId.toString() === req.user?.userId;
    })?.role;
    const isOwner = timeLog.user.toString() === req.user.userId;

    if (!isOwner && role !== "ADMIN") {
      return res.status(403).json({ message: "Time log access denied" });
    }

    await timeLog.deleteOne();

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
