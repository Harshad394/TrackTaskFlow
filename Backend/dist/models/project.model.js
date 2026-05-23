import mongoose, { Schema } from "mongoose";
const projectSchema = new mongoose.Schema({
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
}, {
    timestamps: true,
});
projectSchema.index({ organization: 1, key: 1 }, { unique: true });
projectSchema.index({ "members.userId": 1 });
const Project = mongoose.model("Project", projectSchema);
export default Project;
