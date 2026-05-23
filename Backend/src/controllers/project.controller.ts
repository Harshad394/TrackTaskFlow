import { Response } from "express";
import mongoose from "mongoose";
import Organization, { IOrganization } from "../models/organization.model.js";
import Project from "../models/project.model.js";
import Section from "../models/section.model.js";
import User from "../models/user.model.js";
import { Authrequest } from "../middleware/auth.middleware.js";
import {
  addProjectMemberSchema,
  createProjectSchema,
  updateProjectSchema,
  updateProjectMemberSchema,
} from "../validators/project.validator.js";

const canManageOrganization = (organization: IOrganization | null, userId: string) => {
  return organization?.members.some(
    (member) =>
      member.userId.toString() === userId &&
      (member.role === "OWNER" || member.role === "ADMIN")
  );
};

export const createProject = async (
  req: Authrequest<{ organizationId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: "Invalid organization" });
    }

    const organization = await Organization.findById(organizationId);

    if (!organization || !canManageOrganization(organization, req.user.userId)) {
      return res.status(403).json({ message: "You cannot create projects in this organization" });
    }

    const validatedData = createProjectSchema.parse(req.body);

    const project = await Project.create({
      ...validatedData,
      key: validatedData.key.toUpperCase(),
      organization: organizationId,
      createdBy: req.user.userId,
      members: [
        {
          userId: req.user.userId,
          role: "ADMIN",
        },
      ],
    });

    await Section.insertMany([
      { name: "To Do", order: 0, project: project._id, createdBy: req.user.userId },
      { name: "In Progress", order: 1, project: project._id, createdBy: req.user.userId },
      { name: "Done", order: 2, project: project._id, createdBy: req.user.userId },
    ]);

    return res.status(201).json({ project });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "Project key already exists in this organization" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listProjects = async (
  req: Authrequest<{ organizationId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: "Invalid organization" });
    }

    const organization = await Organization.findOne({
      _id: organizationId,
      "members.userId": req.user.userId,
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const projects = await Project.find({
      organization: organizationId,
      "members.userId": req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ projects });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProject = async (
  req: Authrequest<{ projectId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project" });
    }

    const project = await Project.findOne({
      _id: projectId,
      "members.userId": req.user.userId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json({ project });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProject = async (
  req: Authrequest<{ projectId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project" });
    }

    const validatedData = updateProjectSchema.parse(req.body);

    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        members: {
          $elemMatch: {
            userId: req.user.userId,
            role: "ADMIN",
          },
        },
      },
      {
        $set: {
          ...validatedData,
          key: validatedData.key?.toUpperCase(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied" });
    }

    return res.status(200).json({ project });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "Project key already exists in this organization" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addProjectMember = async (
  req: Authrequest<{ projectId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project" });
    }

    const validatedData = addProjectMemberSchema.parse(req.body);

    if (!mongoose.Types.ObjectId.isValid(validatedData.userId)) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const user = await User.findById(validatedData.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const project = await Project.findOne({
      _id: projectId,
      members: {
        $elemMatch: {
          userId: req.user.userId,
          role: "ADMIN",
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied" });
    }

    const existingMember = project.members.find(
      (member) => member.userId.toString() === validatedData.userId
    );

    if (existingMember) {
      existingMember.role = validatedData.role;
    } else {
      project.members.push({
        userId: new mongoose.Types.ObjectId(validatedData.userId),
        role: validatedData.role,
      });
    }

    await project.save();

    await Organization.updateOne(
      {
        _id: project.organization,
        "members.userId": { $ne: validatedData.userId },
      },
      {
        $push: {
          members: {
            userId: validatedData.userId,
            role: "MEMBER",
          },
        },
      }
    );

    return res.status(200).json({ project });
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

export const updateProjectMember = async (
  req: Authrequest<{ projectId: string; userId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const validatedData = updateProjectMemberSchema.parse(req.body);

    const project = await Project.findOne({
      _id: projectId,
      members: {
        $elemMatch: {
          userId: req.user.userId,
          role: "ADMIN",
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied" });
    }

    const member = project.members.find((projectMember) => {
      return projectMember.userId.toString() === userId;
    });

    if (!member) {
      return res.status(404).json({ message: "Project member not found" });
    }

    member.role = validatedData.role;
    await project.save();

    return res.status(200).json({ project });
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

export const removeProjectMember = async (
  req: Authrequest<{ projectId: string; userId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const project = await Project.findOne({
      _id: projectId,
      members: {
        $elemMatch: {
          userId: req.user.userId,
          role: "ADMIN",
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied" });
    }

    const member = project.members.find((projectMember) => {
      return projectMember.userId.toString() === userId;
    });

    if (!member) {
      return res.status(404).json({ message: "Project member not found" });
    }

    if (member.role === "ADMIN") {
      const adminCount = project.members.filter(
        (projectMember) => projectMember.role === "ADMIN"
      ).length;

      if (adminCount <= 1) {
        return res.status(409).json({ message: "Project must have at least one admin" });
      }
    }

    project.members = project.members.filter((projectMember) => {
      return projectMember.userId.toString() !== userId;
    });
    await project.save();

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
