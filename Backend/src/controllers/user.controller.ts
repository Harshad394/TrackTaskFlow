import User from "../models/user.model.js"
import { Authrequest } from "../middleware/auth.middleware.js"
import { Response } from "express"


export const getMe =async (req:Authrequest,res:Response)=>{
    try {
        if(!req.user || !req.user.userId){
            return res.status(401).json({message:"unauthorized"})
        }
        const user = await User.findById(req.user.userId)
        if(!user){
            return res.status(404).json({message:"user for this id dosent exists"})
        }

        return res.status(200).json({
            id:user._id,
            name:user.name,
            email:user.email,
            role:user.role
        })
        
    } catch (error) {
        return res.status(500).json({message:"server error"})
    };
};

