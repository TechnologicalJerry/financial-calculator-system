import pino, { LoggerOptions } from 'pino';

export interface LoggerConfig {
  serviceName: string;
  environment: string;
  logLevel: string;
}

const defaultRedactPaths = [
  'password',
  '*.password',
  'token',
  '*.token',
  'authorization',
  '*.authorization',
  'headers.authorization',
  'secret',
  '*.secret',
  'apiKey',
  '*.apiKey',
  'refreshToken',
  '*.refreshToken',
  'creditCard',
  '*.creditCard',
  'ssn',
  '*.ssn',
];

export function createLogger(config: LoggerConfig): pino.Logger {
  const isDevelopment = config.environment === 'development';

  const pinoOptions: LoggerOptions = {
    name: config.serviceName,
    level: config.logLevel || 'info',
    base: {
      service: config.serviceName,
      environment: config.environment,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: defaultRedactPaths,
      censor: '[REDACTED]',
    },
  };

  if (isDevelopment && process.env['NODE_ENV'] !== 'test') {
    return pino({
      ...pinoOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino(pinoOptions);
}

// Global logger instance
let defaultLogger: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (!defaultLogger) {
    defaultLogger = createLogger({
      serviceName: process.env['SERVICE_NAME'] || 'financial-calculator-api',
      environment: process.env['NODE_ENV'] || 'development',
      logLevel: process.env['LOG_LEVEL'] || 'info',
    });
  }
  return defaultLogger;
}

export function setLogger(logger: pino.Logger): void {
  defaultLogger = logger;
}

export type Logger = pino.Logger;
