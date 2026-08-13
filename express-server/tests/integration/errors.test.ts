import request from 'supertest';
import { createApp } from '@packages/http';

describe('Centralized Error Handling & Middleware Integration Tests', () => {
  const app = createApp();

  it('should return 404 with standard error JSON format when route does not exist', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND_ERROR');
    expect(res.body.error.message).toContain('not found');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-correlation-id']).toBeDefined();
  });

  it('should propagate client-provided x-request-id and x-correlation-id in response headers', async () => {
    const customReqId = 'custom-request-id-12345';
    const customCorrId = 'custom-correlation-id-67890';

    const res = await request(app)
      .get('/api/v1/health')
      .set('x-request-id', customReqId)
      .set('x-correlation-id', customCorrId);

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe(customReqId);
    expect(res.headers['x-correlation-id']).toBe(customCorrId);
  });
});
