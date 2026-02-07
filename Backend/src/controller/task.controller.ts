import { Response,Request } from "express";
import { createTaskSchema } from "../validators/task.validator.js";
import Task from "../models/task.model.js";
import { Authrequest } from "../middleware/auth.middleware.js";

export const createTask = async(req:Authrequest,res:Response)=>{
    try {
        if(!req.user || !req.user.userId){
            return res.status(400).json({message:"user not found"})
        }
        const validateTask = createTaskSchema.parse(req.body);
        const task =await Task.create({
            ...validateTask,
            owner:req.user.userId
        })
        return res.status(201).json({message:"Task created succesfully",task})
    } catch (error:any) {
        if(error.name =="Zoderror"){
            return res.status(400).json({message:"zod validation error"})
        }
        return res.status(500).json({message:"internal server error"})
    }
}
export const listAllTask =async(req:Authrequest,res:Response)=>{
    try {
        if(!req.user||!req.user.userId){
            return res.status(400).json({message:"unauthorized user"})
        }
        const page = Number(req.query.page) || 1
        const limit =Number(req.query.limit) || 10
        const skip = (page - 1) * limit

        const tasks = await Task.find({owner:req.user.userId})
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)

        const totalTasks = await Task.countDocuments({owner:req.user.userId})

        return res.status(200).json({
            page,
            limit,
            tasks,
            totalTasks,
            totalPages: Math.ceil(totalTasks / limit),
        })

       
    } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
}
export const getOneTask = ()=>{

}

export const updateTask = ()=>{

}
export const deleteTask = ()=>{

}