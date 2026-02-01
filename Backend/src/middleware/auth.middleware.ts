import { Request,Response,NextFunction } from "express"
import jwt from "jsonwebtoken"

export interface Authrequest extends Request {
    user?:{
        userId:string
    }
}

export const authMiddleware =async (req:Authrequest,res:Response,next:NextFunction)=>{
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({message:"header dosent have header"})
        }
        const token = authHeader.split(" ")[1]

        const secrete = process.env.JWT_ACCESS_SECRET

        if(!secrete){
           return res.status(500).json({message:"env file does not provide jwt secrete"})
        }

        const decode =  jwt.verify(token,secrete) as {userid:string}

        req.user = {userId:decode.userid}
        next()
        
    } catch (error) {
        return res.status(401).json({message:"internel server error"})
    }
}