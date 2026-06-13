import mongoose from "mongoose";
import  { Schema, Document } from "mongoose"


export interface IActivity extends Document{
    user: mongoose.Types.ObjectId,
    task: mongoose.Types.ObjectId,
    action: "created" | "updated" | "moved" | "commented" | "time_logged" | "deleted" | "approval_requested" | "approved" | "rejected",
    details?:string,
    createdAt:Date

}
const activitySchema = new mongoose.Schema<IActivity>({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    task:{
        type:Schema.Types.ObjectId,
        ref:"Task",
        required:true
    },
    action:{
        type:String,
        enum: ["created","updated","moved","commented","time_logged","deleted","approval_requested","approved","rejected"],
    },
    details:{
        type:String,
        required:false,
        maxlength:500
    }


},
{
    timestamps:true
}
)

const Activity = mongoose.model<IActivity>("Activity",activitySchema);
export default Activity;
