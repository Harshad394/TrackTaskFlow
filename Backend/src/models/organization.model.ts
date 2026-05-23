import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  ownerId: Types.ObjectId;
  members: {
    userId: Types.ObjectId;
    role: "OWNER" | "ADMIN" | "MEMBER";
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 70,
      trim: true,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
          enum: ["OWNER", "ADMIN", "MEMBER"],
          default: "MEMBER",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);


organizationSchema.index({ "members.userId": 1 });

const Organization = mongoose.model<IOrganization>(
  "Organization",
  organizationSchema
);

export default Organization;
