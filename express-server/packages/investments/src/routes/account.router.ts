import { Router, Request, Response, NextFunction } from 'express';
import { accountService } from '../services/account.service.js';
import { sendSuccess } from '@packages/http';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';

export const accountRouter = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

accountRouter.post(
  '/portfolios/:portfolioId/accounts',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolioId = req.params['portfolioId'] as string;
      const account = await accountService.createAccount(portfolioId, req.user!.userId, req.body);
      sendSuccess(res, account, 201);
    } catch (err) {
      next(err);
    }
  },
);

accountRouter.get(
  '/portfolios/:portfolioId/accounts',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolioId = req.params['portfolioId'] as string;
      const result = await accountService.listAccounts(portfolioId, req.user!.userId, req.query);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },
);

accountRouter.get(
  '/portfolios/:portfolioId/accounts/:accountId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolioId = req.params['portfolioId'] as string;
      const accountId = req.params['accountId'] as string;
      const account = await accountService.getAccountDetail(portfolioId, accountId, req.user!.userId);
      sendSuccess(res, account, 200);
    } catch (err) {
      next(err);
    }
  },
);

accountRouter.patch(
  '/portfolios/:portfolioId/accounts/:accountId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolioId = req.params['portfolioId'] as string;
      const accountId = req.params['accountId'] as string;
      const account = await accountService.updateAccount(portfolioId, accountId, req.user!.userId, req.body);
      sendSuccess(res, account, 200);
    } catch (err) {
      next(err);
    }
  },
);

accountRouter.delete(
  '/portfolios/:portfolioId/accounts/:accountId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolioId = req.params['portfolioId'] as string;
      const accountId = req.params['accountId'] as string;
      const result = await accountService.deleteAccount(portfolioId, accountId, req.user!.userId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);
