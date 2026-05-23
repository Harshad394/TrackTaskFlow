import mongoose, { Document, Schema } from "mongoose";

export interface ISection extends Document {
  name: string;
  project: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new mongoose.Schema<ISection>(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

sectionSchema.index({ project: 1, order: 1 });
sectionSchema.index({ project: 1, name: 1 }, { unique: true });

const Section = mongoose.model<ISection>("Section", sectionSchema);
export default Section;

