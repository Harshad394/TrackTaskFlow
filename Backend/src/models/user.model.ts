import mongoose, { Document, Schema} from "mongoose";
import bcrypt from "bcrypt";



interface IUser extends Document  {
    name:string,
    email:string,
    password:string,
    role:"user"|"admin",
    comparePassword(candidatePassword:string):Promise<boolean>;

}

const userSchema = new Schema<IUser>({
    name:{
        required:true,
        type:String,
        unique:false,
        minlength: 2,
        maxlength: 50,

    },
    email:{
        type: String,
        required:true,
        unique:true,
        trim: true,
        maxlength: 254,
        lowercase:true,
    },
    password:{
        required:true,
        type:String,
        trim:true,
        minlength:8,
        maxlength:128,
        select:false,
    },
    role:{
        type:String,
        enum:["user","admin"]
    },
    
},
{
    timestamps:true
}

)

userSchema.pre("save",async function(){
if(!this.isModified("password")) return;

this.password = await bcrypt.hash(this.password,10)

})

userSchema.methods.comparePassword=async function(candidatePassword:string):Promise<boolean>{
return bcrypt.compare(candidatePassword,this.password);
}

const User = mongoose.model<IUser>("User",userSchema);

export default User;




    
