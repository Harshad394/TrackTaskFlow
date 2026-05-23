import mongoose, { Schema } from "mongoose";
const organizationSchema = new Schema({
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
}, {
    timestamps: true,
});
organizationSchema.index({ "members.userId": 1 });
const Organization = mongoose.model("Organization", organizationSchema);
export default Organization;
