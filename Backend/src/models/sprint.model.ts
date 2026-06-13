import mongoose, { Document, Schema, Types } from "mongoose";

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export interface ISprint extends Document {
  project:   Types.ObjectId;
  name:      string;
  goal?:     string;
  status:    SprintStatus;
  startDate?: Date;
  endDate?:   Date;
  createdBy:  Types.ObjectId;
  createdAt:  Date;
  updatedAt:  Date;
}

const sprintSchema = new Schema<ISprint>(
  {
    project: {
      type:     Schema.Types.ObjectId,
      ref:      "Project",
      required: true,
      index:    true,
    },

    name: {
      type:      String,
      required:  true,
      trim:      true,
      minlength: 2,
      maxlength: 120,
    },

    goal: {
      type:      String,
      trim:      true,
      maxlength: 500,
    },

    status: {
      type:    String,
      enum:    ["PLANNED", "ACTIVE", "COMPLETED"],
      default: "PLANNED",
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    createdBy: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Only one ACTIVE sprint is allowed per project (enforced in the controller)
sprintSchema.index({ project: 1, status: 1 });

const Sprint = mongoose.model<ISprint>("Sprint", sprintSchema);
export default Sprint;
