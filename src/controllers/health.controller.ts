import { Request, Response } from 'express';

import { sendSuccess } from '../utils/response';
import { HealthResponseData } from '../types/api.types';

/**
 * Controller for the /health endpoint.
 * Returns a simple liveness check — useful for load balancers / k8s probes.
 */
export class HealthController {
  /**
   * GET /health
   */
  public check = (_req: Request, res: Response): void => {
    const data: HealthResponseData = { status: 'ok' };
    sendSuccess(res, data);
  };
}
