import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation error',
      data: err.errors,
    };
    res.status(400).json(response);
    return;
  }

  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  };
  res.status(500).json(response);
}

export function notFound(req: Request, res: Response): void {
  const response: ApiResponse = { success: false, error: `Route ${req.path} not found` };
  res.status(404).json(response);
}
