import { Request, Response } from "express";
import User from "../models/user.model.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { createAccessToken, createRefreshToken } from "../utils/jwt.js";
import { acceptPendingProjectInvitationsForUser } from "../services/projectMembership.service.js";
import {
  accessTokenCookieName,
  clearAuthCookieOptions,
  refreshTokenCookieName,
} from "../config/cookies.js";
import jwt from "jsonwebtoken";
import { logAuditEvent } from "../services/audit.service.js";


const formatUserResponse = (user: any) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

export const refreshAccessToken = async (req:Request, res:Response)=>{
  try {
    const refreshToken = req.cookies?.[refreshTokenCookieName];
    if(!refreshToken){
      return res.status(401).json({message:"Refresh token missing"})
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET

    if(!refreshSecret){
      return res.status(500).json({message:"JWT_REFRESH_SECRET not provided"})
    }

    const decoded = jwt.verify(refreshToken,refreshSecret) as {userId:string};
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.clearCookie(accessTokenCookieName, clearAuthCookieOptions);
      res.clearCookie(refreshTokenCookieName, clearAuthCookieOptions);
      return res.status(401).json({ message: "Refresh token user not found" });
    }

    createAccessToken(decoded.userId,res)
    return res.status(200).json({
      message:"Access token refreshed",
      user: formatUserResponse(user),
    })
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

    const acceptedInvitations = await acceptPendingProjectInvitationsForUser({
      userId: user._id.toString(),
      email: user.email,
    });

    createAccessToken(user.id, res);
    createRefreshToken(user.id, res);

    // Audit: new account created
    void logAuditEvent({
      actorUserId: user._id.toString(),
      action: "auth:register",
      entityType: "user",
      entityId: user._id.toString(),
      metadata: { email: user.email, name: user.name },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: formatUserResponse(user),
      acceptedInvitations: acceptedInvitations.length,
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

    // Audit: successful login
    void logAuditEvent({
      actorUserId: user._id.toString(),
      action: "auth:login",
      entityType: "user",
      entityId: user._id.toString(),
      metadata: { email: user.email },
    });

    return res.status(200).json({
      message: "Login successful",
      user: formatUserResponse(user),
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
    // Decode the access token before clearing cookies so we can audit who logged out.
    // Failures are silently ignored – the logout itself always succeeds.
    const token =
      req.cookies?.[accessTokenCookieName] ??
      req.headers.authorization?.split(" ")[1];

    if (token) {
      try {
        const secret = process.env.JWT_ACCESS_SECRET;
        if (secret) {
          const decoded = jwt.verify(token, secret) as { userId: string };
          void logAuditEvent({
            actorUserId: decoded.userId,
            action: "auth:logout",
            entityType: "user",
            entityId: decoded.userId,
          });
        }
      } catch {
        // Expired/invalid token – still log out, just skip audit
      }
    }

    res.clearCookie(accessTokenCookieName, clearAuthCookieOptions);
    res.clearCookie(refreshTokenCookieName, clearAuthCookieOptions);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
