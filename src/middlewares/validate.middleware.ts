import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodSchema, ZodError } from 'zod';

import { sendError } from '../utils/response';

// Generic request body validation middleware using Zod
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const details = zodError.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      sendError(
        res,
        'Request validation failed.',
        StatusCodes.BAD_REQUEST,
        'VALIDATION_ERROR',
        details,
      );
      return;
    }

    // Replace request body with validated and typed data
    req.body = result.data;
    next();
  };
}
