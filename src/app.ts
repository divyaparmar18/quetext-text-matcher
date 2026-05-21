import express, { Application } from 'express';

import { buildHealthRouter } from './routes/health.routes';
import { TextMatcher } from './services/TextMatcher';
import { buildCompareRouter } from './routes/compare.routes';

export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const matcher = new TextMatcher();
  app.use('/compare', buildCompareRouter(matcher));

  app.use('/health', buildHealthRouter());

  return app;
}
