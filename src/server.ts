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

export { server };
