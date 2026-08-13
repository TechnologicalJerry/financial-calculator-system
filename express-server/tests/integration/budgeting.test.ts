import request from 'supertest';
import { createApp } from '@packages/http';
import { signAccessToken } from '@packages/auth';
import { getConfig } from '@packages/config';
import { budgetRepository, goalRepository } from '@packages/budgeting';

jest.mock('@packages/database');
jest.mock('@packages/redis');
jest.mock('@packages/messaging');

describe('Budgeting & Financial Goals Integration & Mandatory IDOR Tests', () => {
  const app = createApp();
  const config = getConfig();

  const userA = { userId: 'user-A-id', email: 'usera@example.com', roles: ['user'] };
  const userB = { userId: 'user-B-id', email: 'userb@example.com', roles: ['user'] };

  const tokenA = signAccessToken({ sub: userA.userId, email: userA.email, roles: userA.roles }, { secret: config.JWT_ACCESS_SECRET });
  const tokenB = signAccessToken({ sub: userB.userId, email: userB.email, roles: userB.roles }, { secret: config.JWT_ACCESS_SECRET });

  const sampleDate = new Date('2026-08-01T00:00:00.000Z');

  const budgetA = {
    id: 'budget-A-1',
    userId: userA.userId,
    name: 'User A Budget',
    currency: 'USD',
    period: 'MONTHLY' as const,
    startDate: sampleDate,
    endDate: new Date('2026-08-31T00:00:00.000Z'),
    status: 'ACTIVE' as const,
    totalLimit: { toString: () => '2000.00' },
    allocations: [],
    expenses: [],
  };

  const goalA = {
    id: 'goal-A-1',
    userId: userA.userId,
    name: 'User A Goal',
    category: 'HOME' as const,
    targetAmount: { toString: () => '50000.00' },
    currentAmount: { toString: () => '10000.00' },
    currency: 'USD',
    targetDate: new Date('2027-12-31T00:00:00.000Z'),
    status: 'ACTIVE' as const,
    contributions: [],
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('Budget APIs', () => {
    it('POST /api/v1/budgets should create a new budget', async () => {
      jest.spyOn(budgetRepository, 'createBudgetWithAllocations').mockResolvedValue(budgetA as any);

      const res = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'User A Budget',
          currency: 'USD',
          period: 'MONTHLY',
          startDate: '2026-08-01T00:00:00Z',
          endDate: '2026-08-31T00:00:00Z',
          totalLimit: 2000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('budget-A-1');
    });

    it('GET /api/v1/budgets should list budgets for owner', async () => {
      jest.spyOn(budgetRepository, 'findBudgetsForUser').mockResolvedValue([budgetA as any]);
      jest.spyOn(budgetRepository, 'countBudgetsForUser').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/budgets')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('GET /api/v1/budgets/:id/progress should return progress metrics', async () => {
      jest.spyOn(budgetRepository, 'findBudgetByIdForUser').mockResolvedValue(budgetA as any);

      const res = await request(app)
        .get(`/api/v1/budgets/${budgetA.id}/progress`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalLimit).toBe('2000.00');
    });
  });

  describe('Financial Goal APIs', () => {
    it('POST /api/v1/goals should create a new goal', async () => {
      jest.spyOn(goalRepository, 'createGoal').mockResolvedValue(goalA as any);

      const res = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'User A Goal',
          category: 'HOME',
          targetAmount: 50000,
          targetDate: '2027-12-31T00:00:00Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('goal-A-1');
    });

    it('POST /api/v1/goals/:goalId/contributions should add contribution and update balance', async () => {
      jest.spyOn(goalRepository, 'findGoalByIdForUser').mockResolvedValue(goalA as any);
      jest.spyOn(goalRepository, 'createContributionAndUpdateBalance').mockResolvedValue({
        contribution: { id: 'contrib-1', amount: '500.00' },
        goal: { ...goalA, currentAmount: { toString: () => '10500.00' } },
      } as any);

      const res = await request(app)
        .post(`/api/v1/goals/${goalA.id}/contributions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          amount: 500,
          currency: 'USD',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contribution.id).toBe('contrib-1');
    });
  });

  // MANDATORY IDOR PROTECTION TESTS
  describe('MANDATORY IDOR PROTECTION TESTS FOR STAGE 5', () => {
    it('User B MUST NOT be able to access User A budget detail', async () => {
      jest.spyOn(budgetRepository, 'findBudgetByIdForUser').mockImplementation(async (id, userId) => {
        if (id === budgetA.id && userId === userA.userId) return budgetA as any;
        return null;
      });

      const res = await request(app)
        .get(`/api/v1/budgets/${budgetA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B MUST NOT be able to delete User A budget', async () => {
      jest.spyOn(budgetRepository, 'findBudgetByIdForUser').mockImplementation(async (id, userId) => {
        if (id === budgetA.id && userId === userA.userId) return budgetA as any;
        return null;
      });
      jest.spyOn(budgetRepository, 'deleteBudgetForUser').mockImplementation(async (id, userId) => {
        if (id === budgetA.id && userId === userA.userId) return budgetA as any;
        return null;
      });

      const res = await request(app)
        .delete(`/api/v1/budgets/${budgetA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B MUST NOT be able to add expense to User A budget', async () => {
      jest.spyOn(budgetRepository, 'findBudgetByIdForUser').mockImplementation(async (id, userId) => {
        if (id === budgetA.id && userId === userA.userId) return budgetA as any;
        return null;
      });

      const res = await request(app)
        .post(`/api/v1/budgets/${budgetA.id}/expenses`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          amount: 50,
          categoryId: '11111111-1111-1111-1111-111111111111',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B MUST NOT be able to access User A financial goal detail', async () => {
      jest.spyOn(goalRepository, 'findGoalByIdForUser').mockImplementation(async (id, userId) => {
        if (id === goalA.id && userId === userA.userId) return goalA as any;
        return null;
      });

      const res = await request(app)
        .get(`/api/v1/goals/${goalA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B MUST NOT be able to contribute to User A financial goal', async () => {
      jest.spyOn(goalRepository, 'findGoalByIdForUser').mockImplementation(async (id, userId) => {
        if (id === goalA.id && userId === userA.userId) return goalA as any;
        return null;
      });

      const res = await request(app)
        .post(`/api/v1/goals/${goalA.id}/contributions`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          amount: 100,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
