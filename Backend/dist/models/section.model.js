import mongoose, { Schema } from "mongoose";
const sectionSchema = new mongoose.Schema({
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
}, {
    timestamps: true,
});
sectionSchema.index({ project: 1, order: 1 });
sectionSchema.index({ project: 1, name: 1 }, { unique: true });
const Section = mongoose.model("Section", sectionSchema);
export default Section;
