import { Request, Response, NextFunction } from 'express';
import { MatchResult } from './matcher.types';

// Standard envelope for every successful API response
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

// Standard envelope for every error API response
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

//  POST /compare request body
export interface CompareRequestBody {
  source: string;
  candidate: string;
}

// POST /compare response data
export type CompareResponseData = MatchResult;

// GET /health response data
export interface HealthResponseData {
  status: 'ok';
}

// Typed Express middleware
export type Middleware = (req: Request, res: Response, next: NextFunction) => void;

// Typed async Express middleware
export type AsyncMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;
