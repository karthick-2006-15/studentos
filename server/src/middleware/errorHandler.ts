import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`[API Error] ${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
    });
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `An entry with this ${field} already exists.`
    });
  }

  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Fallback 500 error
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again.'
        : err.message || 'Internal Server Error'
  });
};
