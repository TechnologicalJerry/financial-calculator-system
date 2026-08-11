import { Router, Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { reportService } from '../services/report.service.js';
import { sendSuccess } from '@packages/http';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';

export const analyticsRouter = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

// ANALYTICS ROUTES
analyticsRouter.get(
  '/analytics/dashboard',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getDashboard(req.user!.userId);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/analytics/net-worth',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getNetWorth(req.user!.userId);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/analytics/net-worth/history',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getNetWorthHistory(req.user!.userId, req.query);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/analytics/asset-allocation',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getAssetAllocation(req.user!.userId);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/analytics/expenses',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getExpenseAnalytics(req.user!.userId, req.query);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/analytics/income',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getIncomeAnalytics(req.user!.userId, req.query);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/analytics/cash-flow',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getCashFlow(req.user!.userId, req.query);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/analytics/budgets',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getBudgetAnalytics(req.user!.userId);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/analytics/goals',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getGoalAnalytics(req.user!.userId);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/analytics/investments',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getInvestmentAnalytics(req.user!.userId);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/analytics/investments/performance',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getInvestmentPerformance(req.user!.userId, req.query);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

// REPORT ROUTES
analyticsRouter.post(
  '/reports',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await reportService.createReport(req.user!.userId, req.body);
      sendSuccess(res, report, 201);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/reports',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await reportService.listReports(req.user!.userId, req.query);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },
);

analyticsRouter.get(
  '/reports/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const report = await reportService.getReportDetail(id, req.user!.userId);
      sendSuccess(res, report, 200);
    } catch (err) {
      next(err);
    }
  },
);
