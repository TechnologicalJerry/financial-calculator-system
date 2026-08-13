import { BudgetService, GoalService, budgetRepository, goalRepository } from '@packages/budgeting';
import { ValidationError } from '@packages/errors';

describe('Budgeting & Financial Goals Unit Tests', () => {
  let budgetService: BudgetService;
  let goalService: GoalService;

  beforeEach(() => {
    budgetService = new BudgetService(budgetRepository);
    goalService = new GoalService(goalRepository);
    jest.restoreAllMocks();
  });

  describe('Budget Progress & Precision Calculations', () => {
    it('should compute budget progress percentages and remaining limits accurately using Decimal math', async () => {
      const mockBudget = {
        id: 'b1',
        userId: 'u1',
        name: 'Monthly Budget',
        currency: 'USD',
        period: 'MONTHLY' as const,
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-31'),
        status: 'ACTIVE' as const,
        totalLimit: { toString: () => '1000.00' },
        allocations: [
          {
            id: 'a1',
            budgetId: 'b1',
            categoryId: 'c1',
            limit: { toString: () => '400.00' },
            category: { name: 'Food' },
          },
        ],
        expenses: [
          {
            id: 'e1',
            amount: { toString: () => '150.50' },
            categoryId: 'c1',
            category: { name: 'Food' },
          },
          {
            id: 'e2',
            amount: { toString: () => '49.50' },
            categoryId: 'c1',
            category: { name: 'Food' },
          },
        ],
      };

      jest.spyOn(budgetRepository, 'findBudgetByIdForUser').mockResolvedValue(mockBudget as any);

      const progress = await budgetService.getBudgetProgress('b1', 'u1');

      expect(progress.totalLimit).toBe('1000.00');
      expect(progress.totalSpent).toBe('200.00'); // 150.50 + 49.50
      expect(progress.remaining).toBe('800.00');
      expect(progress.percentageUsed).toBe('20.00');
      expect(progress.categoryProgress.length).toBe(1);
      expect(progress.categoryProgress[0]!.spent).toBe('200.00');
    });

    it('should reject budget creation when sum of category allocations exceeds total limit', async () => {
      await expect(
        budgetService.createBudget('u1', {
          name: 'Over-allocated Budget',
          currency: 'USD',
          period: 'MONTHLY',
          startDate: '2026-08-01T00:00:00Z',
          endDate: '2026-08-31T00:00:00Z',
          totalLimit: 500,
          allocations: [
            { categoryId: '11111111-1111-1111-1111-111111111111', limit: 400 },
            { categoryId: '22222222-2222-2222-2222-222222222222', limit: 200 }, // sum 600 > 500
          ],
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Financial Goal Calculations & Progress', () => {
    it('should calculate goal progress and remaining target accurately', async () => {
      const mockGoal = {
        id: 'g1',
        userId: 'u1',
        name: 'Emergency Fund',
        category: 'EMERGENCY_FUND' as const,
        targetAmount: { toString: () => '10000.00' },
        currentAmount: { toString: () => '2500.00' },
        currency: 'USD',
        targetDate: new Date(Date.now() + 86400000 * 30),
        status: 'ACTIVE' as const,
      };

      jest.spyOn(goalRepository, 'findGoalByIdForUser').mockResolvedValue(mockGoal as any);

      const progress = await goalService.getGoalProgress('g1', 'u1');

      expect(progress.targetAmount).toBe('10000.00');
      expect(progress.currentAmount).toBe('2500.00');
      expect(progress.remainingAmount).toBe('7500.00');
      expect(progress.percentageComplete).toBe('25.00');
      expect(progress.daysRemaining).toBeGreaterThanOrEqual(29);
    });

    it('should reject goal creation with non-positive target amount', async () => {
      await expect(
        goalService.createGoal('u1', {
          name: 'Invalid Goal',
          targetAmount: 0,
          targetDate: '2027-01-01T00:00:00Z',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
