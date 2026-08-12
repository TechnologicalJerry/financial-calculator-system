import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  SERVICE_NAME: z.string().default('financial-calculator-api'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  CORS_ORIGIN: z.string().default('*'),
});

export type Config = z.infer<typeof envSchema>;

let cachedConfig: Config | null = null;

export function loadConfig(customEnv?: Record<string, string | undefined>): Config {
  const envToValidate = customEnv || process.env;
  const result = envSchema.safeParse(envToValidate);

  if (!result.success) {
    const formattedErrors = result.error.format();
    const errorMessage = `Environment validation failed:\n${JSON.stringify(formattedErrors, null, 2)}`;
    throw new Error(errorMessage);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function getConfig(): Config {
  if (!cachedConfig) {
    return loadConfig();
  }
  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}
