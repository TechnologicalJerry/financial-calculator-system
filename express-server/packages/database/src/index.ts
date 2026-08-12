import { PrismaClient } from '@prisma/client';
import { DatabaseError } from '@packages/errors';
import { getLogger } from '@packages/logger';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log:
        process.env['NODE_ENV'] === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }
  return prismaInstance;
}

export async function connectDatabase(): Promise<PrismaClient> {
  const logger = getLogger();
  const client = getPrismaClient();
  try {
    await client.$connect();
    logger.info('Successfully connected to PostgreSQL database via Prisma');
    return client;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to PostgreSQL database');
    throw new DatabaseError('Failed to establish database connection', error);
  }
}

export async function disconnectDatabase(): Promise<void> {
  const logger = getLogger();
  if (prismaInstance) {
    try {
      await prismaInstance.$disconnect();
      logger.info('Disconnected from PostgreSQL database');
    } catch (error) {
      logger.error({ error }, 'Error disconnecting from PostgreSQL database');
    } finally {
      prismaInstance = null;
    }
  }
}

export async function pingDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return { ok: true, latencyMs };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, latencyMs, error: errorMsg };
  }
}

export async function withTransaction<T>(
  fn: (tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  const client = getPrismaClient();
  try {
    return await client.$transaction(fn);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Database transaction failed', error);
  }
}
