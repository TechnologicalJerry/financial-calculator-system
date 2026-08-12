import { Router, Request, Response } from 'express';
import { pingDatabase } from '@packages/database';
import { pingRedis } from '@packages/redis';
import { pingRabbitMQ } from '@packages/messaging';
import { HealthCheckResult, HealthComponentStatus } from '@packages/types';

export const healthRouter = Router();

const startTime = Date.now();

/**
 * GET /api/v1/health
 * Basic system health status
 */
healthRouter.get('/health', (_req: Request, res: Response) => {
  const result: HealthCheckResult = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: process.env['SERVICE_NAME'] || 'financial-calculator-api',
    environment: process.env['NODE_ENV'] || 'development',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/v1/health/live
 * Liveness probe - returns 200 if app process is running
 */
healthRouter.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/v1/health/startup
 * Startup probe - returns 200 if app initial boot is completed
 */
healthRouter.get('/health/startup', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'started',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/v1/health/ready
 * Readiness probe - checks connectivity to PostgreSQL, Redis, RabbitMQ
 */
healthRouter.get('/health/ready', async (_req: Request, res: Response) => {
  const [dbResult, redisResult, rabbitResult] = await Promise.allSettled([
    pingDatabase(),
    pingRedis(),
    pingRabbitMQ(),
  ]);

  const formatComponent = (
    result: PromiseSettledResult<{ ok: boolean; latencyMs: number; error?: string }>,
  ): HealthComponentStatus => {
    if (result.status === 'fulfilled' && result.value.ok) {
      return { status: 'up', latencyMs: result.value.latencyMs };
    }
    const errorMsg =
      result.status === 'rejected'
        ? String(result.reason)
        : result.value.error || 'Connection failed';
    return { status: 'down', error: errorMsg };
  };

  const dbStatus = formatComponent(dbResult);
  const redisStatus = formatComponent(redisResult);
  const rabbitStatus = formatComponent(rabbitResult);

  const isAllUp =
    dbStatus.status === 'up' &&
    redisStatus.status === 'up' &&
    rabbitStatus.status === 'up';

  const isAnyUp =
    dbStatus.status === 'up' ||
    redisStatus.status === 'up' ||
    rabbitStatus.status === 'up';

  const overallStatus: 'ok' | 'degraded' | 'unhealthy' = isAllUp
    ? 'ok'
    : isAnyUp
      ? 'degraded'
      : 'unhealthy';

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  const responseData: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: process.env['SERVICE_NAME'] || 'financial-calculator-api',
    environment: process.env['NODE_ENV'] || 'development',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    components: {
      postgresql: dbStatus,
      redis: redisStatus,
      rabbitmq: rabbitStatus,
    },
  };

  res.status(statusCode).json({
    success: overallStatus !== 'unhealthy',
    data: responseData,
  });
});
