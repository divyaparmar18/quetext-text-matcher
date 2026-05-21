import { StatusCodes } from 'http-status-codes';

// Base application error. All domain-level errors should extend this class, so that the global error handler can distinguish them from unexpected errors.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    code = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    // Maintain proper prototype chain in transpiled JS
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

//400 Bad Request
export class ValidationError extends AppError {
  public readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super(message, StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR');
    this.details = details;
  }
}

//404 Not Found
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found.`, StatusCodes.NOT_FOUND, 'NOT_FOUND');
  }
}
