import express, { Application, Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { TextMatcher } from './services/TextMatcher';
import { buildHealthRouter } from './routes/health.routes';
import { buildCompareRouter } from './routes/compare.routes';
import { globalErrorHandler, notFoundHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/request-logger.middleware';
import { sendError } from './utils/response';

//Creates and configures the Express application.
export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Intercept malformed JSON before it propagates as a 500
  app.use(
    (err: Error & { type?: string }, _req: Request, res: Response, next: NextFunction): void => {
      if (err.type === 'entity.parse.failed') {
        sendError(
          res,
          'Request body contains malformed JSON.',
          StatusCodes.BAD_REQUEST,
          'VALIDATION_ERROR',
        );
        return;
      }
      next(err);
    },
  );

  app.use(requestLogger);

  const matcher = new TextMatcher();

  app.use('/health', buildHealthRouter());
  app.use('/compare', buildCompareRouter(matcher));

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
