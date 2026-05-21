import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiErrorResponse, ApiResponse } from '../types/api.types';

export function sendSuccess<T>(res: Response, data: T, statusCode: number = StatusCodes.OK): void {
  const body: ApiResponse<T> = { success: true, data };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
  code = 'INTERNAL_ERROR',
  details?: unknown,
): void {
  const body: ApiErrorResponse = {
    success: false,
    error: { message, code, ...(details !== undefined ? { details } : {}) },
  };
  res.status(statusCode).json(body);
}
