import request from 'supertest';
import { createApp } from '@packages/http';
import { signAccessToken } from '@packages/auth';
import { getConfig } from '@packages/config';
import {
  portfolioRepository,
  accountRepository,
  securityRepository,
  transactionRepository,
} from '@packages/investments';

jest.mock('@packages/database');
jest.mock('@packages/redis');
jest.mock('@packages/messaging');

describe('Stage 6 Investment & Portfolio Management Integration & IDOR Tests', () => {
  const app = createApp();
  const config = getConfig();

  const userA = { userId: 'user-A-investor-id', email: 'usera.investor@example.com', roles: ['user'] };
  const userB = { userId: 'user-B-investor-id', email: 'userb.investor@example.com', roles: ['user'] };

  const tokenA = signAccessToken({ sub: userA.userId, email: userA.email, roles: userA.roles }, { secret: config.JWT_ACCESS_SECRET });
  const tokenB = signAccessToken({ sub: userB.userId, email: userB.email, roles: userB.roles }, { secret: config.JWT_ACCESS_SECRET });

  const portfolioA = {
    id: 'portfolio-A-1',
    userId: userA.userId,
    name: 'User A Growth Portfolio',
    description: 'Tech & Dividend Stocks',
    baseCurrency: 'USD',
    status: 'ACTIVE' as const,
    cashBalance: { toString: () => '5000.00' },
    accounts: [],
    holdings: [],
  };

  const accountA = {
    id: 'account-A-1',
    portfolioId: portfolioA.id,
    userId: userA.userId,
    name: 'Brokerage Account 1',
    accountType: 'BROKERAGE' as const,
    currency: 'USD',
    status: 'ACTIVE' as const,
  };

  const securityAAPL = {
    id: 'security-AAPL-1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    assetType: 'STOCK' as const,
    currency: 'USD',
    status: 'ACTIVE' as const,
    prices: [{ price: { toString: () => '175.00' } }],
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('Portfolio APIs', () => {
    it('POST /api/v1/portfolios should create a new portfolio', async () => {
      jest.spyOn(portfolioRepository, 'createPortfolio').mockResolvedValue(portfolioA as any);

      const res = await request(app)
        .post('/api/v1/portfolios')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'User A Growth Portfolio',
          description: 'Tech & Dividend Stocks',
          baseCurrency: 'USD',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(portfolioA.id);
    });

    it('GET /api/v1/portfolios should list user portfolios', async () => {
      jest.spyOn(portfolioRepository, 'findPortfoliosForUser').mockResolvedValue([portfolioA as any]);
      jest.spyOn(portfolioRepository, 'countPortfoliosForUser').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/portfolios')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('GET /api/v1/portfolios/:id/valuation should return valuation metrics', async () => {
      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockResolvedValue(portfolioA as any);
      jest.spyOn(transactionRepository, 'findTransactionsForPortfolio').mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/v1/portfolios/${portfolioA.id}/valuation`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cashBalance).toBe('5000.00');
    });
  });

  describe('Investment Account APIs', () => {
    it('POST /api/v1/portfolios/:portfolioId/accounts should create an account', async () => {
      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockResolvedValue(portfolioA as any);
      jest.spyOn(accountRepository, 'createAccount').mockResolvedValue(accountA as any);

      const res = await request(app)
        .post(`/api/v1/portfolios/${portfolioA.id}/accounts`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Brokerage Account 1',
          accountType: 'BROKERAGE',
          currency: 'USD',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(accountA.id);
    });
  });

  describe('Security APIs', () => {
    it('GET /api/v1/securities should list securities', async () => {
      jest.spyOn(securityRepository, 'findSecurities').mockResolvedValue([securityAAPL as any]);
      jest.spyOn(securityRepository, 'countSecurities').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/securities')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].symbol).toBe('AAPL');
    });
  });

  // MANDATORY IDOR PROTECTION TESTS
  describe('MANDATORY IDOR PROTECTION TESTS FOR STAGE 6', () => {
    it('User B MUST NOT be able to access User A portfolio detail', async () => {
      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockImplementation(async (id, userId) => {
        if (id === portfolioA.id && userId === userA.userId) return portfolioA as any;
        return null;
      });

      const res = await request(app)
        .get(`/api/v1/portfolios/${portfolioA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B MUST NOT be able to delete User A portfolio', async () => {
      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockImplementation(async (id, userId) => {
        if (id === portfolioA.id && userId === userA.userId) return portfolioA as any;
        return null;
      });
      jest.spyOn(portfolioRepository, 'deletePortfolioForUser').mockImplementation(async (id, userId) => {
        if (id === portfolioA.id && userId === userA.userId) return portfolioA as any;
        return null;
      });

      const res = await request(app)
        .delete(`/api/v1/portfolios/${portfolioA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B MUST NOT be able to access User A investment account', async () => {
      jest.spyOn(accountRepository, 'findAccountByIdForUser').mockImplementation(async (id, pId, userId) => {
        if (id === accountA.id && pId === portfolioA.id && userId === userA.userId) return accountA as any;
        return null;
      });

      const res = await request(app)
        .get(`/api/v1/portfolios/${portfolioA.id}/accounts/${accountA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B MUST NOT be able to execute BUY transaction against User A portfolio', async () => {
      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockImplementation(async (id, userId) => {
        if (id === portfolioA.id && userId === userA.userId) return portfolioA as any;
        return null;
      });

      const res = await request(app)
        .post(`/api/v1/portfolios/${portfolioA.id}/transactions/buy`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          investmentAccountId: '11111111-1111-1111-1111-111111111111',
          securityId: '22222222-2222-2222-2222-222222222222',
          quantity: 10,
          price: 150,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B MUST NOT be able to execute SELL transaction against User A portfolio', async () => {
      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockImplementation(async (id, userId) => {
        if (id === portfolioA.id && userId === userA.userId) return portfolioA as any;
        return null;
      });

      const res = await request(app)
        .post(`/api/v1/portfolios/${portfolioA.id}/transactions/sell`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          investmentAccountId: '11111111-1111-1111-1111-111111111111',
          securityId: '22222222-2222-2222-2222-222222222222',
          quantity: 5,
          price: 160,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B MUST NOT be able to execute WITHDRAWAL against User A portfolio', async () => {
      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockImplementation(async (id, userId) => {
        if (id === portfolioA.id && userId === userA.userId) return portfolioA as any;
        return null;
      });

      const res = await request(app)
        .post(`/api/v1/portfolios/${portfolioA.id}/transactions/withdrawal`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          investmentAccountId: '11111111-1111-1111-1111-111111111111',
          amount: 500,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B MUST NOT be able to view holdings of User A portfolio', async () => {
      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockImplementation(async (id, userId) => {
        if (id === portfolioA.id && userId === userA.userId) return portfolioA as any;
        return null;
      });

      const res = await request(app)
        .get(`/api/v1/portfolios/${portfolioA.id}/holdings`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B MUST NOT be able to view transactions of User A portfolio', async () => {
      jest.spyOn(portfolioRepository, 'findPortfolioByIdForUser').mockImplementation(async (id, userId) => {
        if (id === portfolioA.id && userId === userA.userId) return portfolioA as any;
        return null;
      });

      const res = await request(app)
        .get(`/api/v1/portfolios/${portfolioA.id}/transactions`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
