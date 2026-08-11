import { Router, Request, Response, NextFunction } from 'express';
import { FinancialAccountService } from '../services/financial-account.service.js';
import { validateBody, createAccountSchema, updateAccountSchema } from '@packages/validation';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';
import { sendSuccess } from '@packages/http';

export const accountsRouter = Router();
const accountService = new FinancialAccountService();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

/**
 * GET /api/v1/accounts
 */
accountsRouter.get(
  '/accounts',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const accounts = await accountService.getAccounts(userId);
      sendSuccess(res, accounts, 200);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v1/accounts/:id
 */
accountsRouter.get(
  '/accounts/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const accountId = req.params['id'] as string;
      const account = await accountService.getAccountById(userId, accountId);
      sendSuccess(res, account, 200);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/accounts
 */
accountsRouter.post(
  '/accounts',
  requireAuth,
  validateBody(createAccountSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const account = await accountService.createAccount(userId, req.body);
      sendSuccess(res, account, 201);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/v1/accounts/:id
 */
accountsRouter.patch(
  '/accounts/:id',
  requireAuth,
  validateBody(updateAccountSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const accountId = req.params['id'] as string;
      const account = await accountService.updateAccount(userId, accountId, req.body);
      sendSuccess(res, account, 200);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/v1/accounts/:id
 */
accountsRouter.delete(
  '/accounts/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const accountId = req.params['id'] as string;
      const result = await accountService.deleteAccount(userId, accountId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);
