import Redis, { RedisOptions } from 'ioredis';
import { getLogger } from '@packages/logger';
import { ExternalServiceError } from '@packages/errors';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
    const options: RedisOptions = {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    };
    redisClient = new Redis(redisUrl, options);

    redisClient.on('error', (err) => {
      getLogger().error({ err }, 'Redis connection error');
    });
  }
  return redisClient;
}

export async function connectRedis(): Promise<Redis> {
  const logger = getLogger();
  const client = getRedisClient();
  if (client.status === 'ready' || client.status === 'connecting') {
    return client;
  }
  try {
    await client.connect();
    logger.info('Successfully connected to Redis');
    return client;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Redis');
    throw new ExternalServiceError('Failed to establish Redis connection', error);
  }
}

export async function disconnectRedis(): Promise<void> {
  const logger = getLogger();
  if (redisClient) {
    try {
      if (redisClient.status !== 'end') {
        await redisClient.quit();
      }
      logger.info('Disconnected from Redis');
    } catch (error) {
      logger.error({ error }, 'Error disconnecting from Redis');
    } finally {
      redisClient = null;
    }
  }
}

export async function pingRedis(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const client = getRedisClient();
    if (client.status !== 'ready' && client.status !== 'connecting') {
      await client.connect();
    }
    const pong = await client.ping();
    const latencyMs = Date.now() - start;
    if (pong === 'PONG') {
      return { ok: true, latencyMs };
    }
    return { ok: false, latencyMs, error: `Unexpected ping response: ${pong}` };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, latencyMs, error: errorMsg };
  }
}

export class RedisService {
  private client: Redis;

  constructor(client?: Redis) {
    this.client = client || getRedisClient();
  }

  public async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (ttlSeconds && ttlSeconds > 0) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }

  public async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }

  public async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }
}
