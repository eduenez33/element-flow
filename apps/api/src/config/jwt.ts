import jwt from "jsonwebtoken";
import { AppError } from "../lib/errors.js";

export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
export const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "15m") as `${number}${"s" | "m" | "h" | "d" | "w" | "y"}`;
export const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ||
  "7d") as `${number}${"s" | "m" | "h" | "d" | "w" | "y"}`;

export type TokenPayload = {
  userId: string;
  email: string;
};

export const verifyToken = (token: string, secret: string): TokenPayload => {
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "Invalid or expired token");
  }
};

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
};
