import type { ErrorRequestHandler } from "express";
import { AppError } from "../lib/errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  // Default error response
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred";

  if (err.name === "ZodError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = err.issues
      .map((i: any) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
  } else if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
  }

  res.status(status).json({ error: { code, message } });
};
