import jwt from "jsonwebtoken";
import { Response } from "express";
import {
  accessTokenCookieName,
  accessTokenCookieOptions,
  refreshTokenCookieName,
  refreshTokenCookieOptions,
} from "../config/cookies.js";

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

  res.cookie(accessTokenCookieName, token, accessTokenCookieOptions);

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

  res.cookie(refreshTokenCookieName, token, refreshTokenCookieOptions);

  return token;
};
