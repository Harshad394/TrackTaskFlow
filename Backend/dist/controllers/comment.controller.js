import mongoose from "mongoose";
import Activity from "../models/activity.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import { createCommentSchema, updateCommentSchema, } from "../validators/comment.validator.js";
export const createTaskComment = async (req, res) => {
    try {
        if (!req.user?.userId || !req.task) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const validatedData = createCommentSchema.parse(req.body);
        const comment = await Comment.create({
            task: req.task._id,
            project: req.task.project,
            author: req.user.userId,
            body: validatedData.body,
        });
        await Activity.create({
            user: req.user.userId,
            task: req.task._id,
            action: "commented",
            details: "Comment added",
        });
        if (req.task.assignee &&
            req.task.assignee.toString() !== req.user.userId) {
            await Notification.create({
                recipient: req.task.assignee,
                actor: req.user.userId,
                project: req.task.project,
                task: req.task._id,
                type: "task_commented",
                title: "New comment",
                message: `New comment on "${req.task.title}"`,
            });
        }
        return res.status(201).json({ comment });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                message: "Validation failed",
                errors: error.errors,
            });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const listTaskComments = async (req, res) => {
    try {
        const comments = await Comment.find({ task: req.params.taskId })
            .sort({ createdAt: 1 })
            .populate("author", "name email");
        return res.status(200).json({ comments });
    }
    catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const updateComment = async (req, res) => {
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
        const role = project?.members.find((member) => member.userId.toString() === req.user?.userId)?.role;
        const isAuthor = comment.author.toString() === req.user.userId;
        if (!isAuthor && role !== "ADMIN") {
            return res.status(403).json({ message: "Comment access denied" });
        }
        comment.set(validatedData);
        await comment.save();
        return res.status(200).json({ comment });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                message: "Validation failed",
                errors: error.errors,
            });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const deleteComment = async (req, res) => {
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
        const role = project?.members.find((member) => member.userId.toString() === req.user?.userId)?.role;
        const isAuthor = comment.author.toString() === req.user.userId;
        if (!isAuthor && role !== "ADMIN") {
            return res.status(403).json({ message: "Comment access denied" });
        }
        await comment.deleteOne();
        return res.status(204).send();
    }
    catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};
