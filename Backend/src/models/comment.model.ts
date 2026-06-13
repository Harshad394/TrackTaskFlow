import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  task:     mongoose.Types.ObjectId;
  project:  mongoose.Types.ObjectId;
  author:   mongoose.Types.ObjectId;
  body:     string;
  mentions: mongoose.Types.ObjectId[];   // resolved @mentioned project member IDs
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new mongoose.Schema<IComment>(
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
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 2000,
      trim: true,
    },

    mentions: {
      type:    [Schema.Types.ObjectId],
      ref:     "User",
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ task: 1, createdAt: -1 });

const Comment = mongoose.model<IComment>("Comment", commentSchema);
export default Comment;

