import { Router } from 'express';

import { HealthController } from '../controllers/health.controller';

export function buildHealthRouter(): Router {
  const router = Router();
  const controller = new HealthController();

  // GET / - Health check endpoint
  router.get('/', controller.check);

  return router;
}
