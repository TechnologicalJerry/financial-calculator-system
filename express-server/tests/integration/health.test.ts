import request from 'supertest';
import { createApp } from '@packages/http';
import * as databaseModule from '@packages/database';
import * as redisModule from '@packages/redis';
import * as messagingModule from '@packages/messaging';

jest.mock('@packages/database');
jest.mock('@packages/redis');
jest.mock('@packages/messaging');

describe('Health Endpoints Integration Tests', () => {
  const app = createApp();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /api/v1/health should return 200 OK with service health metadata', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.service).toBeDefined();
  });

  it('GET /api/v1/health/live should return 200 OK', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('alive');
  });

  it('GET /api/v1/health/startup should return 200 OK', async () => {
    const res = await request(app).get('/api/v1/health/startup');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('started');
  });

  it('GET /api/v1/health/ready should return 200 OK when all infrastructure services are connected', async () => {
    (databaseModule.pingDatabase as jest.Mock).mockResolvedValue({ ok: true, latencyMs: 2 });
    (redisModule.pingRedis as jest.Mock).mockResolvedValue({ ok: true, latencyMs: 1 });
    (messagingModule.pingRabbitMQ as jest.Mock).mockResolvedValue({ ok: true, latencyMs: 3 });

    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.components.postgresql.status).toBe('up');
    expect(res.body.data.components.redis.status).toBe('up');
    expect(res.body.data.components.rabbitmq.status).toBe('up');
  });

  it('GET /api/v1/health/ready should return 503 Service Unavailable when all infrastructure services fail', async () => {
    (databaseModule.pingDatabase as jest.Mock).mockResolvedValue({ ok: false, latencyMs: 5, error: 'DB Connection Refused' });
    (redisModule.pingRedis as jest.Mock).mockResolvedValue({ ok: false, latencyMs: 2, error: 'Redis Connection Refused' });
    (messagingModule.pingRabbitMQ as jest.Mock).mockResolvedValue({ ok: false, latencyMs: 3, error: 'RabbitMQ Connection Refused' });

    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.data.status).toBe('unhealthy');
  });
});
