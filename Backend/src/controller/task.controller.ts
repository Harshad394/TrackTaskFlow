import { Response,Request } from "express";
import { createTaskSchema, updateTaskSchema } from "../validators/task.validator.js";

import { Authrequest } from "../middleware/auth.middleware.js";
import mongoose from "mongoose";
import Task from "../models/task.model.js";
import { object } from "zod";

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

export const getOneTask = async (req:Authrequest,res:Response,)=>{
   try {
    if(!req.user || !req.user.userId){
        return res.status(401).json({message:"unauthorize user"})
    }
    const id = req.params.id
    const taskId = Array.isArray(id) ? id[0] : id;

    if(!mongoose.Types.ObjectId.isValid(taskId)){
        return res.status(400).json({message:"invalid task"})
    }
    const task = await Task.findOne({_id:taskId,owner:req.user.userId})
    if(!task){
        return res.status(401).json({message:"task not found"})
    }
    return res.status(200).json({task})
   } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }

}

export const updateTask = async (req: Authrequest<{id:string}>, res: Response) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: "unauthorized user" })
        }
        const id = req.params.id
        

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "invalid taskid" })
        }
        const validateData = updateTaskSchema.parse(req.body)

        const task = await Task.findOneAndUpdate(
            { _id: id, owner: req.user.userId },
            { $set: validateData },
            { new: true, runValidators: true }
        )
        if (!task) { return res.status(404).json({ message: "Task not found" }); }

        return res.status(200).json({ task })
    } catch (error) {
        return res.status(500).json({ message: "internal server error" })
    }
}
export const deleteTask = async(req:Authrequest<{id:string}>,res:Response)=>{
    try {
        if(!req.user || !req.user.userId){
            return res.status(401).json({message:"unauthorize user"})
        }
        const id = req.params.id
        

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({message:"invalid task"})
        }
        const task = await Task.findOneAndDelete({_id:id,owner:req.user.userId})

        if(!task){
            return res.status(404).json({message:"task not found"})
        }
        return res.status(200).send()

    } catch (error) {
        return res.status(500).json({message:"internal server error"})
    }
}

export const taskCount = async (req: Authrequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const stats = await Task.aggregate([
      {
        $match: { owner: req.user.userId }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: stats.reduce((acc, cur) => acc + cur.count, 0),
      todoCount: stats.find(s => s._id === "todo")?.count || 0,
      inProgressCount: stats.find(s => s._id === "in-progress")?.count || 0,
      doneCount: stats.find(s => s._id === "done")?.count || 0
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error fetching task stats:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
