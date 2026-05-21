import 'dotenv/config';
import http from 'http';

import { config } from './config/app.config';
import { createApp } from './app';
import { logger } from './utils/logger';

const app = createApp();
const server = http.createServer(app);

server.listen(config.port, () => {
  logger.info(`Server running`, {
    port: config.port,
    env: config.nodeEnv,
  });
});

//graceful shutdown
function shutdown(signal: string): void {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close((err) => {
    if (err) {
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
    logger.info('Server closed. Exiting.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection — shutting down', { reason });
  process.exit(1);
});

export { server };
