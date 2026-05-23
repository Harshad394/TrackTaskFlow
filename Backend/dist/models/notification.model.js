import mongoose, { Schema } from "mongoose";
const notificationSchema = new mongoose.Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    actor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true,
    },
    task: {
        type: Schema.Types.ObjectId,
        ref: "Task",
        index: true,
    },
    type: {
        type: String,
        enum: ["task_assigned", "task_commented", "task_moved"],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    readAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
