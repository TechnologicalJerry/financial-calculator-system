import { TransactionService, valuationService, portfolioRepository, accountRepository, securityRepository, transactionRepository } from '@packages/investments';
import { ValidationError } from '@packages/errors';
import { toDecimal } from '@packages/calculators';

describe('Stage 6 Investment & Portfolio Management Unit Tests', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService(
      transactionRepository,
      portfolioRepository,
      accountRepository,
      securityRepository,
    );
    jest.restoreAllMocks();
  });

  describe('Decimal & Financial Precision', () => {
    it('should correctly handle high precision decimal math for fractional asset quantities', () => {
      const q1 = toDecimal('0.000001');
      const q2 = toDecimal('123456789.123456789');
      const sum = q1.plus(q2);
      expect(sum.toString()).toBe('123456789.123457789');
    });
  });

  describe('BUY & SELL Financial Logic & Validation', () => {
    it('should reject BUY transaction when cash balance is insufficient', async () => {
      const mockPortfolio = {
        id: 'p1',
        userId: 'u1',
        name: 'Tech Portfolio',
        baseCurrency: 'USD',
        cashBalance: { toString: () => '100.00' },
      };

      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockResolvedValue(mockPortfolio as any);
      jest.spyOn(accountRepository, 'findAccountByIdForUser').mockResolvedValue({ id: 'acc1' } as any);
      jest.spyOn(securityRepository, 'findSecurityById').mockResolvedValue({ id: 'sec1', symbol: 'AAPL' } as any);

      await expect(
        transactionService.executeBuy('p1', 'u1', {
          investmentAccountId: '11111111-1111-1111-1111-111111111111',
          securityId: '22222222-2222-2222-2222-222222222222',
          quantity: 10,
          price: 150, // Total 1500 > cash 100
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject WITHDRAWAL when requested amount exceeds available cash balance', async () => {
      const mockPortfolio = {
        id: 'p1',
        userId: 'u1',
        name: 'Retirement Portfolio',
        baseCurrency: 'USD',
        cashBalance: { toString: () => '50.00' },
      };

      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockResolvedValue(mockPortfolio as any);
      jest.spyOn(accountRepository, 'findAccountByIdForUser').mockResolvedValue({ id: 'acc1' } as any);

      await expect(
        transactionService.executeWithdrawal('p1', 'u1', {
          investmentAccountId: '11111111-1111-1111-1111-111111111111',
          amount: 200, // 200 > 50
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Portfolio Valuation & Allocation', () => {
    it('should compute net portfolio value and unrealized gain/loss accurately', async () => {
      const mockPortfolio = {
        id: 'p1',
        userId: 'u1',
        name: 'Growth Portfolio',
        baseCurrency: 'USD',
        cashBalance: { toString: () => '1000.00' },
        holdings: [
          {
            id: 'h1',
            investmentAccountId: 'acc1',
            securityId: 'sec1',
            quantity: { toString: () => '10' },
            averageCost: { toString: () => '100.00' },
            totalCost: { toString: () => '1000.00' },
            security: {
              symbol: 'AAPL',
              name: 'Apple Inc.',
              assetType: 'STOCK',
              prices: [{ price: { toString: () => '150.00' } }],
            },
          },
        ],
      };

      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockResolvedValue(mockPortfolio as any);
      jest.spyOn(transactionRepository, 'findTransactionsForPortfolio').mockResolvedValue([]);

      const valuation = await valuationService.getPortfolioValuation('p1', 'u1');

      expect(valuation.totalMarketValue).toBe('1500.00'); // 10 * 150
      expect(valuation.totalCost).toBe('1000.00');
      expect(valuation.unrealizedGainLoss).toBe('500.00');
      expect(valuation.cashBalance).toBe('1000.00');
      expect(valuation.netPortfolioValue).toBe('2500.00'); // 1500 + 1000
    });
  });
});
