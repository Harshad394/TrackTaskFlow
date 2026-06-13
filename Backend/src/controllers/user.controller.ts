import User from "../models/user.model.js"
import { Authrequest } from "../middleware/auth.middleware.js"
import { Response } from "express"
import { searchUsersSchema } from "../validators/user.validator.js";
import { buildPaginationMeta, getPaginationOptions } from "../utils/pagination.js";

const escapeRegex = (value: string) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


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

export const searchUsers = async (req: Authrequest, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const filters = searchUsersSchema.parse(req.query);
        const searchRegex = new RegExp(escapeRegex(filters.q), "i");
        const { skip, limit } = getPaginationOptions(filters.page, filters.limit);

        const query = {
            _id: { $ne: req.user.userId },
            $or: [{ name: searchRegex }, { email: searchRegex }],
        };

        const [users, total] = await Promise.all([
            User.find(query)
            .select("name email role")
                .skip(skip)
                .limit(limit)
                .sort({ name: 1, email: 1 }),
            User.countDocuments(query),
        ]);

        return res.status(200).json({
            count: users.length,
            pagination: buildPaginationMeta({
                page: filters.page,
                limit: filters.limit,
                total,
            }),
            users,
        });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                message: "Validation failed",
                errors: error.errors,
            });
        }

        return res.status(500).json({ message: "server error" });
    }
};
