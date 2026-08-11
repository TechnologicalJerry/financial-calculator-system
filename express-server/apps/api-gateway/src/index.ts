import { Server } from 'http';
import { createApp } from '@packages/http';
import { getConfig } from '@packages/config';
import { getLogger } from '@packages/logger';
import { disconnectDatabase } from '@packages/database';
import { disconnectRedis } from '@packages/redis';
import { disconnectRabbitMQ } from '@packages/messaging';

export async function startServer(): Promise<{ app: ReturnType<typeof createApp>; server: Server }> {
  const config = getConfig();
  const logger = getLogger();

  const app = createApp();

  const server = app.listen(config.PORT, config.HOST, () => {
    logger.info(
      {
        service: config.SERVICE_NAME,
        environment: config.NODE_ENV,
        port: config.PORT,
        host: config.HOST,
      },
      `Server listening on http://${config.HOST}:${config.PORT}/api/v1`,
    );
  });

  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.warn({ signal }, `Received ${signal}, starting graceful shutdown...`);

    // 1. Close HTTP server
    server.close(async (err) => {
      if (err) {
        logger.error({ err }, 'Error closing HTTP server');
      } else {
        logger.info('HTTP server closed');
      }

      try {
        // 2. RabbitMQ
        await disconnectRabbitMQ();

        // 3. Redis
        await disconnectRedis();

        // 4. Database
        await disconnectDatabase();

        logger.info('Graceful shutdown completed successfully');
        process.exit(0);
      } catch (shutdownErr) {
        logger.error({ err: shutdownErr }, 'Error during graceful shutdown execution');
        process.exit(1);
      }
    });

    // Timeout fallback for shutdown
    setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return { app, server };
}

// Auto-run if executed directly
if (require.main === module) {
  startServer().catch((err) => {
    getLogger().error({ err }, 'Failed to start API Gateway server');
    process.exit(1);
  });
}
