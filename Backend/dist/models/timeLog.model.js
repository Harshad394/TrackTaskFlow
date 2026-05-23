import mongoose, { Schema } from "mongoose";
const timeLogSchema = new mongoose.Schema({
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
}, {
    timestamps: true,
});
timeLogSchema.index({ project: 1, loggedAt: -1 });
timeLogSchema.index({ task: 1, loggedAt: -1 });
const TimeLog = mongoose.model("TimeLog", timeLogSchema);
export default TimeLog;
