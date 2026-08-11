import { Router, Request, Response, NextFunction } from 'express';
import { goalService } from '../services/goal.service.js';
import { sendSuccess } from '@packages/http';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';

export const goalRouter = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

// GOAL ROUTES
goalRouter.post(
  '/goals',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const goal = await goalService.createGoal(req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, goal, 201);
    } catch (err) {
      next(err);
    }
  },
);

goalRouter.get(
  '/goals',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await goalService.listGoals(req.user!.userId, req.query);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },
);

goalRouter.get(
  '/goals/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const goal = await goalService.getGoalDetail(id, req.user!.userId);
      sendSuccess(res, goal, 200);
    } catch (err) {
      next(err);
    }
  },
);

goalRouter.patch(
  '/goals/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const goal = await goalService.updateGoal(id, req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, goal, 200);
    } catch (err) {
      next(err);
    }
  },
);

goalRouter.delete(
  '/goals/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const result = await goalService.deleteGoal(id, req.user!.userId, req.correlationId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);

goalRouter.get(
  '/goals/:id/progress',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const progress = await goalService.getGoalProgress(id, req.user!.userId);
      sendSuccess(res, progress, 200);
    } catch (err) {
      next(err);
    }
  },
);

// CONTRIBUTION ROUTES
goalRouter.post(
  '/goals/:goalId/contributions',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const goalId = req.params['goalId'] as string;
      const result = await goalService.createContribution(goalId, req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  },
);

goalRouter.get(
  '/goals/:goalId/contributions',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const goalId = req.params['goalId'] as string;
      const result = await goalService.listContributions(goalId, req.user!.userId, req.query);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },
);

goalRouter.get(
  '/goals/:goalId/contributions/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const goalId = req.params['goalId'] as string;
      const id = req.params['id'] as string;
      const contribution = await goalService.getContributionDetail(goalId, id, req.user!.userId);
      sendSuccess(res, contribution, 200);
    } catch (err) {
      next(err);
    }
  },
);

goalRouter.delete(
  '/goals/:goalId/contributions/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const goalId = req.params['goalId'] as string;
      const id = req.params['id'] as string;
      const result = await goalService.deleteContribution(goalId, id, req.user!.userId, req.correlationId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);
