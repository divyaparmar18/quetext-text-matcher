import 'dotenv/config';

interface AppConfig {
  nodeEnv: string;
  port: number;
  logLevel: string;
  apiVersion: string;
}

function loadConfig(): AppConfig {
  const port = parseInt(process.env.PORT ?? '5010', 10);

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid PORT value: "${process.env.PORT}". Must be a number between 1 and 65535.`,
    );
  }

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port,
    logLevel: process.env.LOG_LEVEL ?? 'info',
    apiVersion: process.env.API_VERSION ?? 'v1',
  };
}

// Singleton config object - validated once at startup
export const config: AppConfig = loadConfig();
