import { Request, Response } from "express";
import User from "../models/user.model.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { createAccessToken, createRefreshToken } from "../utils/jwt.js";
import jwt, { JwtPayload } from "jsonwebtoken"





export const refreshAccessToken =(req:Request, res:Response)=>{
 
  try {
    const refreshToken = req.cookies.refreshToken
  if(!refreshToken){
   return res.status(401).json({message:"cookies dosent provide token"})
  }
  const refreshSecret = process.env.JWT_REFRESH_SECRET

  if(!refreshSecret){
   return res.status(500).json({message:"JWT_REFRESH_SECRET not provided"})
  }
  const decoded = jwt.verify(refreshToken,refreshSecret) as {userId:string};
  
  createAccessToken(decoded.userId,res)
  return res.status(200).json({message:"acess token refresh"})


  }catch (error) {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }


}

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password, role } = validatedData;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    createAccessToken(user.id, res);
    createRefreshToken(user.id, res);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    createAccessToken(user.id, res);
    createRefreshToken(user.id, res);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req: Request, res: Response) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
