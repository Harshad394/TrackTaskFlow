import mongoose, { Document, Schema, Types } from "mongoose";
import { ProjectMemberRole } from "./project.model.js";

export type ProjectInvitationStatus = "PENDING" | "ACCEPTED" | "CANCELLED";

export interface IProjectInvitation extends Document {
  project: Types.ObjectId;
  organization: Types.ObjectId;
  email: string;
  role: ProjectMemberRole;
  invitedBy: Types.ObjectId;
  acceptedBy?: Types.ObjectId;
  status: ProjectInvitationStatus;
  acceptedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectInvitationSchema = new mongoose.Schema<IProjectInvitation>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    role: {
      type: String,
      enum: ["ADMIN", "DEVELOPER", "QA", "CLIENT"],
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    acceptedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    acceptedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

projectInvitationSchema.index(
  { project: 1, email: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "PENDING" },
  }
);

const ProjectInvitation = mongoose.model<IProjectInvitation>(
  "ProjectInvitation",
  projectInvitationSchema
);

export default ProjectInvitation;
