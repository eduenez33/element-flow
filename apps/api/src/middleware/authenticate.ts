import type { RequestHandler } from "express";
import { AppError } from "../lib/errors.js";
import { JWT_SECRET, verifyToken } from "../config/jwt.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const parts = authHeader?.split(" ");
  if (!parts || parts.length !== 2 || parts[0] !== "Bearer") {
    throw new AppError(401, "UNAUTHORIZED", "Invalid authorization header");
  }

  req.user = verifyToken(parts[1], JWT_SECRET);
  next();
};
