import { Router, Request, Response, NextFunction } from 'express';
import { portfolioService } from '../services/portfolio.service.js';
import { valuationService } from '../services/valuation.service.js';
import { sendSuccess } from '@packages/http';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';

export const portfolioRouter = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

portfolioRouter.post(
  '/portfolios',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolio = await portfolioService.createPortfolio(req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, portfolio, 201);
    } catch (err) {
      next(err);
    }
  },
);

portfolioRouter.get(
  '/portfolios',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await portfolioService.listPortfolios(req.user!.userId, req.query);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },
);

portfolioRouter.get(
  '/portfolios/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const portfolio = await portfolioService.getPortfolioDetail(id, req.user!.userId);
      sendSuccess(res, portfolio, 200);
    } catch (err) {
      next(err);
    }
  },
);

portfolioRouter.patch(
  '/portfolios/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const portfolio = await portfolioService.updatePortfolio(id, req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, portfolio, 200);
    } catch (err) {
      next(err);
    }
  },
);

portfolioRouter.delete(
  '/portfolios/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const result = await portfolioService.deletePortfolio(id, req.user!.userId, req.correlationId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);

portfolioRouter.get(
  '/portfolios/:id/valuation',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const result = await valuationService.getPortfolioValuation(id, req.user!.userId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);

portfolioRouter.get(
  '/portfolios/:id/allocation',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const result = await valuationService.getPortfolioAllocation(id, req.user!.userId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);

portfolioRouter.get(
  '/portfolios/:id/performance',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const result = await valuationService.getPortfolioPerformance(id, req.user!.userId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);
