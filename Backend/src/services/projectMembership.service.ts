import mongoose from "mongoose";
import Organization from "../models/organization.model.js";
import Project, { ProjectMemberRole } from "../models/project.model.js";
import ProjectInvitation from "../models/projectInvitation.model.js";

export const addUserToProjectAndOrganization = async ({
  projectId,
  userId,
  role,
}: {
  projectId: string | mongoose.Types.ObjectId;
  userId: string | mongoose.Types.ObjectId;
  role: ProjectMemberRole;
}) => {
  const project = await Project.findById(projectId);

  if (!project) {
    return null;
  }

  const userObjectId = new mongoose.Types.ObjectId(userId.toString());
  const existingMember = project.members.find((member) => {
    return member.userId.toString() === userId.toString();
  });

  if (existingMember) {
    existingMember.role = role;
  } else {
    project.members.push({
      userId: userObjectId,
      role,
    });
  }

  await project.save();

  await Organization.updateOne(
    {
      _id: project.organization,
      "members.userId": { $ne: userObjectId },
    },
    {
      $push: {
        members: {
          userId: userObjectId,
          role: "MEMBER",
        },
      },
    }
  );

  return project;
};

export const acceptPendingProjectInvitationsForUser = async ({
  userId,
  email,
}: {
  userId: string | mongoose.Types.ObjectId;
  email: string;
}) => {
  const invitations = await ProjectInvitation.find({
    email: email.toLowerCase(),
    status: "PENDING",
  });

  const acceptedInvitations = [];

  for (const invitation of invitations) {
    const project = await addUserToProjectAndOrganization({
      projectId: invitation.project,
      userId,
      role: invitation.role,
    });

    if (project) {
      invitation.status = "ACCEPTED";
      invitation.acceptedBy = new mongoose.Types.ObjectId(userId.toString());
      invitation.acceptedAt = new Date();
      await invitation.save();
      acceptedInvitations.push(invitation);
    }
  }

  return acceptedInvitations;
};
