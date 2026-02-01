import jwt from "jsonwebtoken";
import { Response } from "express";

export const createAccessToken = (userId: string, res: Response): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET not defined");
  }

  const token = jwt.sign(
    { userId },
    secret,
    { expiresIn: "15m" }
  );

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  return token;
};

export const createRefreshToken = (userId: string, res: Response): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET not defined");
  }

  const token = jwt.sign(
    { userId },
    secret,
    { expiresIn: "30d" }
  );

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return token;
};
