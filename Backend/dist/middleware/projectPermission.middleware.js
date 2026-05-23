import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Section from "../models/section.model.js";
import Task from "../models/task.model.js";
const findMemberRole = (project, userId) => {
    return project.members.find((member) => member.userId.toString() === userId)
        ?.role;
};
export const requireProjectRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { projectId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ message: "Invalid project" });
            }
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            const role = findMemberRole(project, req.user.userId);
            if (!role || !allowedRoles.includes(role)) {
                return res.status(403).json({ message: "Project access denied" });
            }
            req.project = project;
            req.projectRole = role;
            next();
        }
        catch {
            return res.status(500).json({ message: "Internal server error" });
        }
    };
};
export const requireTaskProjectRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { taskId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(taskId)) {
                return res.status(400).json({ message: "Invalid task" });
            }
            const task = await Task.findById(taskId);
            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }
            const project = await Project.findById(task.project);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            const role = findMemberRole(project, req.user.userId);
            if (!role || !allowedRoles.includes(role)) {
                return res.status(403).json({ message: "Project access denied" });
            }
            req.task = task;
            req.project = project;
            req.projectRole = role;
            next();
        }
        catch {
            return res.status(500).json({ message: "Internal server error" });
        }
    };
};
export const requireSectionProjectRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { sectionId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(sectionId)) {
                return res.status(400).json({ message: "Invalid section" });
            }
            const section = await Section.findById(sectionId);
            if (!section) {
                return res.status(404).json({ message: "Section not found" });
            }
            const project = await Project.findById(section.project);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            const role = findMemberRole(project, req.user.userId);
            if (!role || !allowedRoles.includes(role)) {
                return res.status(403).json({ message: "Project access denied" });
            }
            req.section = section;
            req.project = project;
            req.projectRole = role;
            next();
        }
        catch {
            return res.status(500).json({ message: "Internal server error" });
        }
    };
};
