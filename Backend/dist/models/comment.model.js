import mongoose, { Schema } from "mongoose";
const commentSchema = new mongoose.Schema({
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
}, {
    timestamps: true,
});
commentSchema.index({ task: 1, createdAt: -1 });
const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
