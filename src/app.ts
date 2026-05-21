import express, { Application } from 'express';

import { buildHealthRouter } from './routes/health.routes';

export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use('/health', buildHealthRouter());

  return app;
}
