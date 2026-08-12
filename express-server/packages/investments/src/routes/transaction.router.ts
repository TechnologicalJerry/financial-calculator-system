import { Router, Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service.js';
import { sendSuccess } from '@packages/http';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';

export const transactionRouter = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

transactionRouter.post(
  '/portfolios/:portfolioId/transactions/buy',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolioId = req.params['portfolioId'] as string;
      const transaction = await transactionService.executeBuy(portfolioId, req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, transaction, 201);
    } catch (err) {
      next(err);
    }
  },
);

transactionRouter.post(
  '/portfolios/:portfolioId/transactions/sell',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolioId = req.params['portfolioId'] as string;
      const transaction = await transactionService.executeSell(portfolioId, req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, transaction, 201);
    } catch (err) {
      next(err);
    }
  },
);

transactionRouter.post(
  '/portfolios/:portfolioId/transactions/dividend',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolioId = req.params['portfolioId'] as string;
      const transaction = await transactionService.executeDividend(portfolioId, req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, transaction, 201);
    } catch (err) {
      next(err);
    }
  },
);

transactionRouter.post(
  '/portfolios/:portfolioId/transactions/deposit',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolioId = req.params['portfolioId'] as string;
      const transaction = await transactionService.executeDeposit(portfolioId, req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, transaction, 201);
    } catch (err) {
      next(err);
    }
  },
);

transactionRouter.post(
  '/portfolios/:portfolioId/transactions/withdrawal',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolioId = req.params['portfolioId'] as string;
      const transaction = await transactionService.executeWithdrawal(portfolioId, req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, transaction, 201);
    } catch (err) {
      next(err);
    }
  },
);

transactionRouter.get(
  '/portfolios/:id/transactions',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const result = await transactionService.listTransactions(id, req.user!.userId, req.query);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },
);

transactionRouter.get(
  '/portfolios/:id/transactions/:transactionId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const transactionId = req.params['transactionId'] as string;
      const transaction = await transactionService.getTransactionDetail(id, transactionId, req.user!.userId);
      sendSuccess(res, transaction, 200);
    } catch (err) {
      next(err);
    }
  },
);
