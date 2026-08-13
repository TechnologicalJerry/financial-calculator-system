import request from 'supertest';
import { createApp } from '@packages/http';
import { signAccessToken } from '@packages/auth';
import { getConfig } from '@packages/config';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('@packages/database', () => {
  const mockProfiles = new Map<string, any>();
  const mockPreferences = new Map<string, any>();

  const mockPrisma = {
    financialProfile: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(mockProfiles.get(where.userId) || {
          id: 'prof-1',
          userId: where.userId,
          currency: 'USD',
          country: 'US',
          monthlyIncome: new Decimal(5000),
          monthlyExpenses: new Decimal(2000),
          riskTolerance: 'MEDIUM',
          financialGoalSummary: 'Save for retirement',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        const existing = mockProfiles.get(where.userId) || {
          id: 'prof-1',
          userId: where.userId,
          currency: 'USD',
          country: 'US',
          monthlyIncome: new Decimal(5000),
          monthlyExpenses: new Decimal(2000),
          riskTolerance: 'MEDIUM',
          financialGoalSummary: 'Save for retirement',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updated = {
          ...existing,
          ...data,
          monthlyIncome: data.monthlyIncome !== undefined ? new Decimal(data.monthlyIncome) : existing.monthlyIncome,
          monthlyExpenses: data.monthlyExpenses !== undefined ? new Decimal(data.monthlyExpenses) : existing.monthlyExpenses,
          updatedAt: new Date(),
        };

        mockProfiles.set(where.userId, updated);
        return Promise.resolve(updated);
      }),
    },
    financialPreferences: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(mockPreferences.get(where.userId) || {
          id: 'pref-1',
          userId: where.userId,
          baseCurrency: 'USD',
          locale: 'en-US',
          dateFormat: 'YYYY-MM-DD',
          numberFormat: 'standard',
          timezone: 'UTC',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
    },
  };

  return {
    getPrismaClient: () => mockPrisma,
    connectDatabase: jest.fn(),
    disconnectDatabase: jest.fn(),
    pingDatabase: jest.fn().mockResolvedValue({ ok: true, latencyMs: 1 }),
  };
});

describe('Financial Profile API Integration Tests', () => {
  const app = createApp();
  const config = getConfig();

  const userId = 'user-profile-123';
  const token = signAccessToken({ sub: userId, email: 'profile@example.com' }, { secret: config.JWT_ACCESS_SECRET });

  it('GET /api/v1/profile should return current user profile and preferences', async () => {
    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile.userId).toBe(userId);
    expect(res.body.data.preferences).toBeDefined();
  });

  it('PATCH /api/v1/profile should update current user financial profile', async () => {
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        monthlyIncome: 7500,
        riskTolerance: 'HIGH',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.monthlyIncome).toBe('7500');
    expect(res.body.data.riskTolerance).toBe('HIGH');
  });

  it('GET /api/v1/profile without auth token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
