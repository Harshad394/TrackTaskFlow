import { Response } from "express";
import mongoose from "mongoose";
import Section from "../models/section.model.js";
import Task from "../models/task.model.js";
import TimeLog from "../models/timeLog.model.js";
import { ProjectAuthRequest } from "../middleware/projectPermission.middleware.js";
import { projectAnalyticsQuerySchema } from "../validators/analytics.validator.js";

const parseDate = (value: string, fieldName: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return date;
};

const countByKey = <T extends Record<string, any>>(items: T[], key: string) => {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = item[key] || "unassigned";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
};

export const getProjectAnalytics = async (
  req: ProjectAuthRequest<{ projectId: string }>,
  res: Response
) => {
  try {
    const filters = projectAnalyticsQuerySchema.parse(req.query);
    const projectId = new mongoose.Types.ObjectId(req.params.projectId);
    const dateRange: Record<string, Date> = {};

    if (filters.from) {
      dateRange.$gte = parseDate(filters.from, "from");
    }

    if (filters.to) {
      dateRange.$lte = parseDate(filters.to, "to");
    }

    const taskQuery: Record<string, any> = { project: projectId };
    const timeLogQuery: Record<string, any> = { project: projectId };

    if (Object.keys(dateRange).length > 0) {
      taskQuery.createdAt = dateRange;
      timeLogQuery.loggedAt = dateRange;
    }

    const [sections, tasks, timeLogs] = await Promise.all([
      Section.find({ project: projectId }).sort({ order: 1, createdAt: 1 }),
      Task.find(taskQuery)
        .populate("section", "name order")
        .populate("assignee", "name email")
        .lean(),
      TimeLog.find(timeLogQuery).populate("user", "name email").lean(),
    ]);

    const doneSectionIds = new Set(
      sections
        .filter((section) => /done|complete|completed/i.test(section.name))
        .map((section) => section._id.toString())
    );

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => {
      return doneSectionIds.has(task.section?._id?.toString?.() || task.section?.toString?.());
    }).length;
    const openTasks = totalTasks - completedTasks;
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const now = new Date();
    const overdueTasks = tasks.filter((task) => {
      return task.dueDate && new Date(task.dueDate) < now && !doneSectionIds.has(
        task.section?._id?.toString?.() || task.section?.toString?.()
      );
    }).length;

    const sectionCounts = sections.map((section) => ({
      section: {
        id: section._id,
        name: section.name,
        order: section.order,
      },
      count: tasks.filter((task) => {
        return (
          task.section?._id?.toString?.() === section._id.toString() ||
          task.section?.toString?.() === section._id.toString()
        );
      }).length,
    }));

    const assigneeCounts = tasks.reduce<
      { assignee: { id: string | null; name: string; email?: string }; count: number }[]
    >((acc, task) => {
      const assignee: any = task.assignee;
      const id = assignee?._id?.toString?.() || null;
      const existing = acc.find((item) => item.assignee.id === id);

      if (existing) {
        existing.count += 1;
      } else {
        acc.push({
          assignee: {
            id,
            name: assignee?.name || "Unassigned",
            email: assignee?.email,
          },
          count: 1,
        });
      }

      return acc;
    }, []);

    const totalMinutes = timeLogs.reduce((total, log) => total + log.minutes, 0);
    const billableMinutes = timeLogs.reduce((total, log) => {
      return log.billable ? total + log.minutes : total;
    }, 0);
    const nonBillableMinutes = totalMinutes - billableMinutes;

    const timeByUser = timeLogs.reduce<
      {
        user: { id: string; name: string; email?: string };
        totalMinutes: number;
        billableMinutes: number;
        nonBillableMinutes: number;
      }[]
    >((acc, log) => {
      const user: any = log.user;
      const id = user?._id?.toString?.() || "unknown";
      const existing = acc.find((item) => item.user.id === id);

      if (existing) {
        existing.totalMinutes += log.minutes;
        existing.billableMinutes += log.billable ? log.minutes : 0;
        existing.nonBillableMinutes += log.billable ? 0 : log.minutes;
      } else {
        acc.push({
          user: {
            id,
            name: user?.name || "Unknown user",
            email: user?.email,
          },
          totalMinutes: log.minutes,
          billableMinutes: log.billable ? log.minutes : 0,
          nonBillableMinutes: log.billable ? 0 : log.minutes,
        });
      }

      return acc;
    }, []);

    return res.status(200).json({
      filters,
      summary: {
        totalTasks,
        completedTasks,
        openTasks,
        overdueTasks,
        completionRate,
        totalTimeLogs: timeLogs.length,
        totalMinutes,
        billableMinutes,
        nonBillableMinutes,
      },
      breakdowns: {
        bySection: sectionCounts,
        byPriority: countByKey(tasks, "priority"),
        byType: countByKey(tasks, "type"),
        byAssignee: assigneeCounts.sort((a, b) => b.count - a.count),
        timeByUser: timeByUser.sort((a, b) => b.totalMinutes - a.totalMinutes),
      },
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
