import mongoose from "mongoose";
import  { Schema, Document } from "mongoose"


export interface IActivity extends Document{
    user: mongoose.Types.ObjectId,
    task: mongoose.Types.ObjectId,
    action: "created" | "updated" | "deleted",
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
        enum: ["created","updated","deleted"],
    },
    details:{
        type:String,
        required:false,
        maxlength:25
    }


},
{
    timestamps:true
}
)

const Activity = mongoose.model<IActivity>("Activity",activitySchema);
export default Activity;
