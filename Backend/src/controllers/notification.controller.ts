import { Response } from "express";
import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import { Authrequest } from "../middleware/auth.middleware.js";
import { notificationFilterSchema } from "../validators/notification.validator.js";

export const listNotifications = async (req: Authrequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const filters = notificationFilterSchema.parse(req.query);
    const query: Record<string, any> = { recipient: req.user.userId };

    if (filters.unreadOnly === "true") {
      query.readAt = { $exists: false };
    }

    if (filters.type) {
      query.type = filters.type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("actor", "name email")
      .populate("project", "name key")
      .populate("task", "title priority type");

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.userId,
      readAt: { $exists: false },
    });

    return res.status(200).json({
      unreadCount,
      count: notifications.length,
      notifications,
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

export const markNotificationRead = async (
  req: Authrequest<{ notificationId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.notificationId)) {
      return res.status(400).json({ message: "Invalid notification" });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        recipient: req.user.userId,
      },
      { $set: { readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ notification });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markAllNotificationsRead = async (
  req: Authrequest,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await Notification.updateMany(
      {
        recipient: req.user.userId,
        readAt: { $exists: false },
      },
      { $set: { readAt: new Date() } }
    );

    return res.status(200).json({ modifiedCount: result.modifiedCount });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteNotification = async (
  req: Authrequest<{ notificationId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.notificationId)) {
      return res.status(400).json({ message: "Invalid notification" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      recipient: req.user.userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
