import request from 'supertest';
import { createApp } from '@packages/http';
import { signAccessToken } from '@packages/auth';
import { getConfig } from '@packages/config';
import { calculationRepository } from '@packages/calculators';

jest.mock('@packages/database');
jest.mock('@packages/redis');
jest.mock('@packages/messaging');

describe('Calculation History & Audit Integration & IDOR Tests', () => {
  const app = createApp();
  const config = getConfig();

  const userA = { userId: 'user-A-id', email: 'usera@example.com', roles: ['user'] };
  const userB = { userId: 'user-B-id', email: 'userb@example.com', roles: ['user'] };

  const tokenA = signAccessToken({ sub: userA.userId, email: userA.email, roles: userA.roles }, { secret: config.JWT_ACCESS_SECRET });
  const tokenB = signAccessToken({ sub: userB.userId, email: userB.email, roles: userB.roles }, { secret: config.JWT_ACCESS_SECRET });

  const sampleDate = new Date('2026-08-11T00:00:00.000Z');

  const calculationA = {
    id: 'calc-user-A-1',
    userId: userA.userId,
    calculatorId: 'compound-interest',
    calculatorVersion: '1.0.0',
    status: 'COMPLETED' as const,
    currency: 'USD',
    input: { principal: '1000.00', annualRate: '5', term: 2, termUnit: 'YEARS' },
    result: { interestEarned: '102.50', finalAmount: '1102.50' },
    createdAt: sampleDate,
    updatedAt: sampleDate,
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('POST /api/v1/calculators/simple-interest/calculate should persist history when authenticated', async () => {
    jest.spyOn(calculationRepository, 'create').mockResolvedValue(calculationA);
    jest.spyOn(calculationRepository, 'createAuditEvent').mockResolvedValue({
      id: 'a1',
      calculationId: calculationA.id,
      userId: userA.userId,
      eventType: 'calculation.created',
      metadata: null,
      createdAt: sampleDate,
    });

    const res = await request(app)
      .post('/api/v1/calculators/simple-interest/calculate')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        principal: 1000,
        annualRate: 5,
        term: 2,
        termUnit: 'YEARS',
        currency: 'USD',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('calc-user-A-1');
  });

  it('GET /api/v1/calculations should return paginated list of user calculations', async () => {
    jest.spyOn(calculationRepository, 'findManyForUser').mockResolvedValue([calculationA]);
    jest.spyOn(calculationRepository, 'countForUser').mockResolvedValue(1);

    const res = await request(app)
      .get('/api/v1/calculations?page=1&limit=10')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.meta.total).toBe(1);
  });

  it('GET /api/v1/calculations/:id should return details for calculation owner', async () => {
    jest.spyOn(calculationRepository, 'findByIdForUser').mockImplementation(async (id, userId) => {
      if (id === calculationA.id && userId === userA.userId) {
        return calculationA;
      }
      return null;
    });

    const res = await request(app)
      .get(`/api/v1/calculations/${calculationA.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(calculationA.id);
  });

  it('DELETE /api/v1/calculations/:id should delete calculation for owner', async () => {
    jest.spyOn(calculationRepository, 'deleteForUser').mockImplementation(async (id, userId) => {
      if (id === calculationA.id && userId === userA.userId) {
        return calculationA;
      }
      return null;
    });
    jest.spyOn(calculationRepository, 'createAuditEvent').mockResolvedValue({
      id: 'a1',
      calculationId: calculationA.id,
      userId: userA.userId,
      eventType: 'calculation.deleted',
      metadata: null,
      createdAt: sampleDate,
    });

    const res = await request(app)
      .delete(`/api/v1/calculations/${calculationA.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted).toBe(true);
  });

  // MANDATORY IDOR PROTECTION TESTS
  describe('MANDATORY IDOR PROTECTION TESTS', () => {
    it('User B MUST NOT be able to access User A calculation detail', async () => {
      jest.spyOn(calculationRepository, 'findByIdForUser').mockImplementation(async (id, userId) => {
        if (id === calculationA.id && userId === userA.userId) {
          return calculationA;
        }
        return null;
      });

      const res = await request(app)
        .get(`/api/v1/calculations/${calculationA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND_ERROR');
    });

    it('User B MUST NOT be able to delete User A calculation record', async () => {
      jest.spyOn(calculationRepository, 'deleteForUser').mockImplementation(async (id, userId) => {
        if (id === calculationA.id && userId === userA.userId) {
          return calculationA;
        }
        return null;
      });

      const res = await request(app)
        .delete(`/api/v1/calculations/${calculationA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND_ERROR');
    });
  });
});
