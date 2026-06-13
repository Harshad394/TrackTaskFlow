import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAttachment extends Document {
  project:    Types.ObjectId;
  task:       Types.ObjectId;
  uploadedBy: Types.ObjectId;
  fileName:   string;
  fileUrl:    string;
  fileType:   string;
  fileSize:   number;          // bytes
  createdAt:  Date;
  updatedAt:  Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    project: {
      type:     Schema.Types.ObjectId,
      ref:      "Project",
      required: true,
      index:    true,
    },

    task: {
      type:     Schema.Types.ObjectId,
      ref:      "Task",
      required: true,
      index:    true,
    },

    uploadedBy: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },

    fileName: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 255,
    },

    fileUrl: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 2048,
    },

    fileType: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 100,     // e.g. "image/png", "application/pdf"
    },

    fileSize: {
      type:     Number,
      required: true,
      min:      1,
      max:      100 * 1024 * 1024,   // 100 MB ceiling
    },
  },
  {
    timestamps: true,
  }
);

attachmentSchema.index({ task: 1, createdAt: -1 });

const Attachment = mongoose.model<IAttachment>("Attachment", attachmentSchema);
export default Attachment;
