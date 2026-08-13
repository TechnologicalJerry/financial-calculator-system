import { loadConfig } from '@packages/config';
import { createRateLimiter } from '@packages/http';

describe('Stage 9 Security & Hardening Unit Tests', () => {
  describe('Environment Validation', () => {
    it('should throw error when required environment variables are invalid or missing', () => {
      expect(() =>
        loadConfig({
          NODE_ENV: 'invalid_env',
          DATABASE_URL: '',
        } as any),
      ).toThrow();
    });

    it('should validate and parse valid environment configuration', () => {
      const config = loadConfig({
        NODE_ENV: 'test',
        PORT: '3000',
        DATABASE_URL: 'postgresql://localhost:5432/testdb',
        REDIS_URL: 'redis://localhost:6379',
        RABBITMQ_URL: 'amqp://localhost:5672',
        JWT_ACCESS_SECRET: 'supersecretjwtkeyatleast16chars',
      });

      expect(config.NODE_ENV).toBe('test');
      expect(config.PORT).toBe(3000);
    });
  });

  describe('Rate Limiter Middleware', () => {
    it('should create rate limiter middleware handler', () => {
      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000 });
      expect(typeof limiter).toBe('function');
    });
  });
});
