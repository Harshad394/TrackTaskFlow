import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new Schema({
    name: {
        required: true,
        type: String,
        unique: false,
        minlength: 2,
        maxlength: 50,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 254,
        lowercase: true,
    },
    password: {
        required: true,
        type: String,
        trim: true,
        minlength: 8,
        maxlength: 128,
        select: false,
    },
    role: {
        type: String,
        enum: ["USER", "SUPER_ADMIN"],
        default: "USER",
    },
}, {
    timestamps: true,
});
userSchema.pre("save", async function () {
    if (!this.isModified("password"))
        return;
    this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
const User = mongoose.model("User", userSchema);
export default User;
