import { analyticsService } from '@packages/analytics';
import { getPrismaClient } from '@packages/database';

jest.mock('@packages/database');

describe('Stage 8 Financial Analytics & Reporting Unit Tests', () => {
  const prismaMock = {
    financialAccount: { findMany: jest.fn() },
    portfolio: { findMany: jest.fn() },
    budgetExpense: { findMany: jest.fn() },
    investmentTransaction: { findMany: jest.fn() },
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    (getPrismaClient as jest.Mock).mockReturnValue(prismaMock);
  });

  describe('Net Worth Calculation', () => {
    it('should calculate net worth as total assets minus liabilities', async () => {
      prismaMock.financialAccount.findMany.mockResolvedValue([
        { type: 'BANK_ACCOUNT', name: 'Checking', balance: { toString: () => '5000.00' } },
        { type: 'BANK_ACCOUNT', name: 'Savings', balance: { toString: () => '10000.00' } },
        { type: 'CREDIT_CARD', name: 'Credit Card', balance: { toString: () => '2000.00' } },
      ]);
      prismaMock.portfolio.findMany.mockResolvedValue([]);

      const result = await analyticsService.getNetWorth('user-1');

      expect(result.totalAssets).toBe('15000.00');
      expect(result.totalLiabilities).toBe('2000.00');
      expect(result.netWorth).toBe('13000.00');
    });
  });

  describe('Expense Analytics', () => {
    it('should compute total expenses, average expense, and category percentages accurately', async () => {
      prismaMock.budgetExpense.findMany.mockResolvedValue([
        {
          amount: { toString: () => '300.00' },
          categoryId: 'cat-1',
          category: { name: 'Housing' },
        },
        {
          amount: { toString: () => '100.00' },
          categoryId: 'cat-2',
          category: { name: 'Food' },
        },
      ]);

      const result = await analyticsService.getExpenseAnalytics('user-1', {});

      expect(result.totalExpenses).toBe('400.00');
      expect(result.averageExpense).toBe('200.00');
      expect(result.categoryBreakdown.length).toBe(2);
    });
  });
});
