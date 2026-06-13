import { Response } from "express";
import mongoose from "mongoose";
import Organization, { IOrganization } from "../models/organization.model.js";
import Project from "../models/project.model.js";
import ProjectInvitation from "../models/projectInvitation.model.js";
import Section from "../models/section.model.js";
import User from "../models/user.model.js";
import { Authrequest } from "../middleware/auth.middleware.js";
import { addUserToProjectAndOrganization } from "../services/projectMembership.service.js";
import { buildPaginationMeta, getPaginationOptions } from "../utils/pagination.js";
import { paginationSchema } from "../validators/pagination.validator.js";
import {
  addProjectMemberSchema,
  createProjectSchema,
  inviteProjectMemberSchema,
  updateProjectSchema,
  updateProjectMemberSchema,
} from "../validators/project.validator.js";
import { logAuditEvent } from "../services/audit.service.js";

const canManageOrganization = (organization: IOrganization | null, userId: string) => {
  return organization?.members.some(
    (member) =>
      member.userId.toString() === userId &&
      (member.role === "OWNER" || member.role === "ADMIN")
  );
};

const populateProjectMembers = (query: any) => {
  return query.populate("members.userId", "name email role");
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
      { name: "To Do",      order: 0, project: project._id, createdBy: req.user.userId },
      { name: "In Progress", order: 1, project: project._id, createdBy: req.user.userId },
      { name: "Done",       order: 2, project: project._id, createdBy: req.user.userId },
    ]);

    // Audit: project created
    void logAuditEvent({
      actorUserId:    req.user.userId,
      organizationId: organizationId,
      projectId:      project._id.toString(),
      action:         "project:created",
      entityType:     "project",
      entityId:       project._id.toString(),
      metadata:       { name: project.name, key: project.key },
    });

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

    const pagination = paginationSchema.parse(req.query);
    const { skip, limit } = getPaginationOptions(pagination.page, pagination.limit);
    const query = {
      organization: organizationId,
      "members.userId": req.user.userId,
    };

    const [projects, total] = await Promise.all([
      Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Project.countDocuments(query),
    ]);

    return res.status(200).json({
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
      projects,
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

    const project = await populateProjectMembers(Project.findOne({
      _id: projectId,
      "members.userId": req.user.userId,
    }));

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

    await addUserToProjectAndOrganization({
      projectId: project._id,
      userId: validatedData.userId,
      role: validatedData.role,
    });

    const updatedProject = await populateProjectMembers(Project.findById(project._id));

    // Audit: member directly added to project
    void logAuditEvent({
      actorUserId:    req.user.userId,
      organizationId: project.organization.toString(),
      projectId:      project._id.toString(),
      action:         "project:member_added",
      entityType:     "project",
      entityId:       project._id.toString(),
      metadata:       { targetUserId: validatedData.userId, role: validatedData.role },
    });

    return res.status(200).json({ project: updatedProject });
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

export const inviteProjectMember = async (
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

    const validatedData = inviteProjectMemberSchema.parse(req.body);
    const email = validatedData.email.toLowerCase();

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

    const user = await User.findOne({ email });

    if (user) {
      await addUserToProjectAndOrganization({
        projectId: project._id,
        userId: user._id.toString(),
        role: validatedData.role,
      });

      await ProjectInvitation.updateMany(
        {
          project: project._id,
          email,
          status: "PENDING",
        },
        {
          $set: {
            status: "ACCEPTED",
            acceptedBy: user._id,
            acceptedAt: new Date(),
          },
        }
      );

      const updatedProject = await populateProjectMembers(Project.findById(project._id));

      // Audit: existing user immediately added via invite flow
      void logAuditEvent({
        actorUserId:    req.user.userId,
        organizationId: project.organization.toString(),
        projectId:      project._id.toString(),
        action:         "project:member_added",
        entityType:     "project",
        entityId:       project._id.toString(),
        metadata:       { targetEmail: email, role: validatedData.role, via: "invite" },
      });

      return res.status(200).json({
        message: "User added to project",
        status: "ACCEPTED",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        project: updatedProject,
      });
    }

    const invitation = await ProjectInvitation.findOneAndUpdate(
      {
        project: project._id,
        email,
        status: "PENDING",
      },
      {
        $set: {
          role: validatedData.role,
          invitedBy: req.user.userId,
          organization: project.organization,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // Audit: pending invitation sent
    void logAuditEvent({
      actorUserId:    req.user.userId,
      organizationId: project.organization.toString(),
      projectId:      project._id.toString(),
      action:         "project:member_invited",
      entityType:     "invitation",
      entityId:       invitation._id.toString(),
      metadata:       { email, role: validatedData.role },
    });

    return res.status(201).json({
      message: "Invitation created",
      status: "PENDING",
      invitation,
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

export const listProjectInvitations = async (
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

    const pagination = paginationSchema.parse(req.query);
    const { skip, limit } = getPaginationOptions(pagination.page, pagination.limit);
    const query = { project: projectId };

    const [invitations, total] = await Promise.all([
      ProjectInvitation.find(query)
      .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
      .populate("invitedBy", "name email")
        .populate("acceptedBy", "name email"),
      ProjectInvitation.countDocuments(query),
    ]);

    return res.status(200).json({
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
      invitations,
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

export const cancelProjectInvitation = async (
  req: Authrequest<{ projectId: string; invitationId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId, invitationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project" });
    }

    if (!mongoose.Types.ObjectId.isValid(invitationId)) {
      return res.status(400).json({ message: "Invalid invitation" });
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

    const invitation = await ProjectInvitation.findOneAndUpdate(
      {
        _id: invitationId,
        project: projectId,
        status: "PENDING",
      },
      {
        $set: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      },
      { new: true }
    );

    if (!invitation) {
      return res.status(404).json({ message: "Pending invitation not found" });
    }

    return res.status(200).json({ invitation });
  } catch {
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

    await project.populate("members.userId", "name email role");

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

    // Audit: member removed from project
    void logAuditEvent({
      actorUserId:    req.user.userId,
      organizationId: project.organization.toString(),
      projectId:      project._id.toString(),
      action:         "project:member_removed",
      entityType:     "project",
      entityId:       project._id.toString(),
      metadata:       { targetUserId: userId, removedRole: member.role },
    });

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
