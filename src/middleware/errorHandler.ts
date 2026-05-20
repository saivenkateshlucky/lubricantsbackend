import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/AppError";

/**
 * Catch-all 404 handler — mount after all routes.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Global error handler — mount as last middleware.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let message = "Internal server error";
  let errors = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err?.name === "ZodError") {
    statusCode = 400;
    message = "Validation Error";
    errors = err.issues;
  } else {
    message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message || err.toString();
  }

  if (statusCode === 500) {
    console.error("❌ Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV !== "production" && statusCode === 500 && { stack: err.stack }),
  });
}
