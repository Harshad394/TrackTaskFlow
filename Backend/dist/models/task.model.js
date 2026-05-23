import mongoose, { Schema } from "mongoose";
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000,
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true,
    },
    section: {
        type: Schema.Types.ObjectId,
        ref: "Section",
        required: true,
        index: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    assignee: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
    },
    type: {
        type: String,
        enum: ["task", "bug", "feature"],
        default: "task",
    },
    labels: {
        type: [String],
        default: [],
        validate: {
            validator: (labels) => labels.length <= 10,
            message: "Task can have up to 10 labels",
        },
    },
    order: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    dueDate: {
        type: Date,
    },
}, {
    timestamps: true,
});
taskSchema.index({ project: 1, section: 1, order: 1 });
taskSchema.index({ project: 1, assignee: 1 });
taskSchema.index({ project: 1, labels: 1 });
const Task = mongoose.model("Task", taskSchema);
export default Task;
