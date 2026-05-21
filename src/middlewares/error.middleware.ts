import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AppError, ValidationError } from '../utils/error';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

// Centralised Express error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    logger.warn('Validation error', { message: err.message, details: err.details });
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  if (err instanceof AppError && err.isOperational) {
    logger.warn('Operational error', { message: err.message, code: err.code });
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  logger.error('Unexpected error', { message: err.message, stack: err.stack });

  sendError(
    res,
    'An unexpected error occurred. Please try again later.',
    StatusCodes.INTERNAL_SERVER_ERROR,
    'INTERNAL_ERROR',
  );
}

/**
 * 404 catch-all for unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Cannot ${req.method} ${req.path}`, StatusCodes.NOT_FOUND, 'NOT_FOUND');
}
