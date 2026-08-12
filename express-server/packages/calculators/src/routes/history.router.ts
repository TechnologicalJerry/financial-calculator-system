import { Router, Request, Response, NextFunction } from 'express';
import { calculationHistoryService } from '../services/calculation-history.service.js';
import { sendSuccess } from '@packages/http';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';

export const historyRouter = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

/**
 * GET /api/v1/calculations
 * Lists history of calculations for authenticated user with pagination and filtering.
 */
historyRouter.get(
  '/calculations',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const result = await calculationHistoryService.listCalculationHistory(userId, req.query);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v1/calculations/:id
 * Retrieves detail of a specific historical calculation owned by authenticated user.
 */
historyRouter.get(
  '/calculations/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const id = req.params['id'] as string;
      const detail = await calculationHistoryService.getCalculationDetail(id, userId);
      sendSuccess(res, detail, 200);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/v1/calculations/:id
 * Deletes a historical calculation record owned by authenticated user.
 */
historyRouter.delete(
  '/calculations/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const id = req.params['id'] as string;
      const result = await calculationHistoryService.deleteCalculationHistory(id, userId, req.correlationId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);
