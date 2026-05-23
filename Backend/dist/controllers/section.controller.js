import Section from "../models/section.model.js";
import Task from "../models/task.model.js";
import { createSectionSchema, updateSectionSchema, } from "../validators/section.validator.js";
export const createProjectSection = async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const validatedData = createSectionSchema.parse(req.body);
        const nextOrder = validatedData.order ??
            (await Section.countDocuments({ project: req.params.projectId }));
        const section = await Section.create({
            name: validatedData.name,
            order: nextOrder,
            project: req.params.projectId,
            createdBy: req.user.userId,
        });
        return res.status(201).json({ section });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                message: "Validation failed",
                errors: error.errors,
            });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: "Section already exists in this project" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const listProjectSections = async (req, res) => {
    try {
        const sections = await Section.find({ project: req.params.projectId }).sort({
            order: 1,
            createdAt: 1,
        });
        return res.status(200).json({ sections });
    }
    catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const updateSection = async (req, res) => {
    try {
        const validatedData = updateSectionSchema.parse(req.body);
        const section = await Section.findByIdAndUpdate(req.params.sectionId, { $set: validatedData }, { new: true, runValidators: true });
        if (!section) {
            return res.status(404).json({ message: "Section not found" });
        }
        return res.status(200).json({ section });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                message: "Validation failed",
                errors: error.errors,
            });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: "Section already exists in this project" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const deleteSection = async (req, res) => {
    try {
        const taskCount = await Task.countDocuments({ section: req.params.sectionId });
        if (taskCount > 0) {
            return res.status(409).json({
                message: "Move or delete tasks before deleting this section",
            });
        }
        const section = await Section.findByIdAndDelete(req.params.sectionId);
        if (!section) {
            return res.status(404).json({ message: "Section not found" });
        }
        return res.status(204).send();
    }
    catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};
