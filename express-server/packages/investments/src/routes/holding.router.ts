import { Router, Request, Response, NextFunction } from 'express';
import { valuationService } from '../services/valuation.service.js';
import { sendSuccess } from '@packages/http';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';

export const holdingRouter = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

holdingRouter.get(
  '/portfolios/:id/holdings',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const result = await valuationService.listHoldings(id, req.user!.userId, req.query);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },
);

holdingRouter.get(
  '/portfolios/:id/holdings/:holdingId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const holdingId = req.params['holdingId'] as string;
      const holding = await valuationService.getHoldingDetail(id, holdingId, req.user!.userId);
      sendSuccess(res, holding, 200);
    } catch (err) {
      next(err);
    }
  },
);
