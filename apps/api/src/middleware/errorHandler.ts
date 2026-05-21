import type { ErrorRequestHandler } from "express";

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
  } else if (err.status === 401) {
    status = 401;
    code = "UNAUTHORIZED";
    message = "Authentication required";
  } else if (err.status === 403) {
    status = 403;
    code = "FORBIDDEN";
    message = "Access denied";
  } else if (err.status === 404) {
    status = 404;
    code = "NOT_FOUND";
    message = "Resource not found";
  } else if (err.status === 409) {
    status = 409;
    code = "CONFLICT";
    message = "Resource already exists";
  }

  res.status(status).json({ error: { code, message } });
};
