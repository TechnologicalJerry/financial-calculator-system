import { loadConfig, resetConfig } from '@packages/config';

describe('Config Package Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    resetConfig();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should validate valid environment configuration successfully', () => {
    const validEnv = {
      NODE_ENV: 'test',
      PORT: '4000',
      HOST: '127.0.0.1',
      SERVICE_NAME: 'test-service',
      LOG_LEVEL: 'warn',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
      REDIS_URL: 'redis://localhost:6379',
      RABBITMQ_URL: 'amqp://guest:guest@localhost:5672',
      JWT_ACCESS_SECRET: 'super-secret-key-at-least-16-characters-long',
      JWT_ACCESS_EXPIRES_IN: '1h',
    };

    const config = loadConfig(validEnv);
    expect(config.NODE_ENV).toBe('test');
    expect(config.PORT).toBe(4000);
    expect(config.HOST).toBe('127.0.0.1');
    expect(config.SERVICE_NAME).toBe('test-service');
  });

  it('should throw validation error when required env variable is missing', () => {
    const invalidEnv = {
      NODE_ENV: 'test',
      DATABASE_URL: '',
    };

    expect(() => loadConfig(invalidEnv)).toThrow('Environment validation failed');
  });
});
