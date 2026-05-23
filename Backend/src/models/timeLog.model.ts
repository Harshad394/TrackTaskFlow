import mongoose, { Document, Schema } from "mongoose";

export interface ITimeLog extends Document {
  task: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  minutes: number;
  note?: string;
  billable: boolean;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const timeLogSchema = new mongoose.Schema<ITimeLog>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    minutes: {
      type: Number,
      required: true,
      min: 1,
      max: 1440,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    billable: {
      type: Boolean,
      default: true,
    },
    loggedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

timeLogSchema.index({ project: 1, loggedAt: -1 });
timeLogSchema.index({ task: 1, loggedAt: -1 });

const TimeLog = mongoose.model<ITimeLog>("TimeLog", timeLogSchema);
export default TimeLog;
