import mongoose from "mongoose";
import { Schema } from "mongoose";
const activitySchema = new mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    task: {
        type: Schema.Types.ObjectId,
        ref: "Task",
        required: true
    },
    action: {
        type: String,
        enum: ["created", "updated", "moved", "commented", "time_logged", "deleted"],
    },
    details: {
        type: String,
        required: false,
        maxlength: 500
    }
}, {
    timestamps: true
});
const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
