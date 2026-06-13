import { CookieOptions } from "express";

const sameSiteValue = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
const sameSite: CookieOptions["sameSite"] =
  sameSiteValue === "none"
    ? "none"
    : sameSiteValue === "strict"
      ? "strict"
      : "lax";

const secure = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production" || sameSite === "none";

const domain = process.env.COOKIE_DOMAIN || undefined;

export const accessTokenCookieName = "accessToken";
export const refreshTokenCookieName = "refreshToken";

export const accessTokenMaxAge = 15 * 60 * 1000;
export const refreshTokenMaxAge = 30 * 24 * 60 * 60 * 1000;

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure,
  sameSite,
  domain,
  path: "/",
};

export const accessTokenCookieOptions: CookieOptions = {
  ...authCookieOptions,
  maxAge: accessTokenMaxAge,
};

export const refreshTokenCookieOptions: CookieOptions = {
  ...authCookieOptions,
  maxAge: refreshTokenMaxAge,
};

export const clearAuthCookieOptions: CookieOptions = {
  ...authCookieOptions,
  maxAge: undefined,
};
