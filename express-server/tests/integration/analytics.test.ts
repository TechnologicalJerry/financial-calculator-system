import request from 'supertest';
import { createApp } from '@packages/http';
import { signAccessToken } from '@packages/auth';
import { getConfig } from '@packages/config';
import { reportRepository } from '@packages/analytics';
import { getPrismaClient } from '@packages/database';

jest.mock('@packages/database');
jest.mock('@packages/redis');
jest.mock('@packages/messaging');

describe('Stage 8 Financial Analytics & Report Integration & IDOR Tests', () => {
  const app = createApp();
  const config = getConfig();

  const userA = { userId: 'user-A-analytics-id', email: 'usera.analytics@example.com', roles: ['user'] };
  const userB = { userId: 'user-B-analytics-id', email: 'userb.analytics@example.com', roles: ['user'] };

  const tokenA = signAccessToken({ sub: userA.userId, email: userA.email, roles: userA.roles }, { secret: config.JWT_ACCESS_SECRET });
  const tokenB = signAccessToken({ sub: userB.userId, email: userB.email, roles: userB.roles }, { secret: config.JWT_ACCESS_SECRET });

  const reportA = {
    id: 'report-A-1',
    userId: userA.userId,
    reportType: 'FINANCIAL_SUMMARY' as const,
    title: 'User A Summary Report',
    data: { netWorth: '50000.00' },
    createdAt: new Date(),
  };

  const prismaMock = {
    financialAccount: { findMany: jest.fn().mockResolvedValue([]) },
    portfolio: { findMany: jest.fn().mockResolvedValue([]) },
    budgetExpense: { findMany: jest.fn().mockResolvedValue([]) },
    investmentTransaction: { findMany: jest.fn().mockResolvedValue([]) },
    budget: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    financialGoal: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    calculation: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    (getPrismaClient as jest.Mock).mockReturnValue(prismaMock);
  });

  describe('Analytics APIs', () => {
    it('GET /api/v1/analytics/dashboard should return dashboard summary', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.netWorth).toBeDefined();
    });

    it('GET /api/v1/analytics/net-worth should return net worth details', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/net-worth')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.netWorth).toBeDefined();
    });

    it('POST /api/v1/reports should generate and persist report', async () => {
      jest.spyOn(reportRepository, 'createReport').mockResolvedValue(reportA as any);

      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          reportType: 'FINANCIAL_SUMMARY',
          title: 'User A Summary Report',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(reportA.id);
    });
  });

  describe('MANDATORY IDOR PROTECTION TESTS FOR REPORTS', () => {
    it('User B MUST NOT be able to access User A report detail', async () => {
      jest.spyOn(reportRepository, 'findReportByIdForUser').mockImplementation(async (id, userId) => {
        if (id === reportA.id && userId === userA.userId) return reportA as any;
        return null;
      });

      const res = await request(app)
        .get(`/api/v1/reports/${reportA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
