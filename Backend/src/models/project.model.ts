import mongoose, { Schema, Document, Types } from "mongoose";

export type ProjectMemberRole = "ADMIN" | "DEVELOPER" | "QA" | "CLIENT";
export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "COMPLETED";

export interface IProject extends Document {
  name: string;
  description?: string;
  organization: Types.ObjectId;
  key: string;
  status: ProjectStatus;
  createdBy: Types.ObjectId;
  members: {
    userId: Types.ObjectId;
    role: ProjectMemberRole;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new mongoose.Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 80,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      maxlength: 500,
      trim: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 10,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED", "COMPLETED"],
      default: "ACTIVE",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["ADMIN", "DEVELOPER", "QA", "CLIENT"],
          default: "DEVELOPER",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ organization: 1, key: 1 }, { unique: true });
projectSchema.index({ "members.userId": 1 });

const Project = mongoose.model<IProject>("Project", projectSchema);
export default Project;
