import { Request, Response } from 'express';

import { sendSuccess } from '../utils/response';
import { HealthResponseData } from '../types/api.types';

// Handles API health check
export class HealthController {
  public check = (_req: Request, res: Response): void => {
    const data: HealthResponseData = { status: 'ok' };
    sendSuccess(res, data);
  };
}
