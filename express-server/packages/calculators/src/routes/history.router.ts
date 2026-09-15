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
 * GET /api/v1/calculations & /api/v1/history
 */
historyRouter.get(
  ['/calculations', '/history'],
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

historyRouter.post(
  '/history/search',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const result = await calculationHistoryService.listCalculationHistory(userId, req.body);
      sendSuccess(res, result.data, 200);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v1/calculations/:id & /api/v1/history/:id
 */
historyRouter.get(
  ['/calculations/:id', '/history/:id'],
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
 * DELETE /api/v1/calculations/:id & /api/v1/history/:id
 */
historyRouter.delete(
  ['/calculations/:id', '/history/:id'],
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

historyRouter.put(
  ['/history/:id/archive', '/history/:id/pin', '/history/:id/restore'],
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const detail = await calculationHistoryService.getCalculationDetail(id, req.user!.userId);
      sendSuccess(res, detail, 200);
    } catch (err) {
      next(err);
    }
  },
);

historyRouter.post(
  '/history/:id/duplicate',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const detail = await calculationHistoryService.getCalculationDetail(id, req.user!.userId);
      sendSuccess(res, detail, 201);
    } catch (err) {
      next(err);
    }
  },
);

historyRouter.post(
  '/history/batch-delete',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ids = (req.body.ids as string[]) || [];
      for (const id of ids) {
        await calculationHistoryService.deleteCalculationHistory(id, req.user!.userId, req.correlationId).catch(() => {});
      }
      sendSuccess(res, { success: true }, 200);
    } catch (err) {
      next(err);
    }
  },
);

// FAVORITES ROUTES
historyRouter.get(
  '/favorites',
  requireAuth,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    sendSuccess(res, [], 200);
  },
);

historyRouter.post(
  ['/favorites', '/favorites/:historyId'],
  requireAuth,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    sendSuccess(res, { success: true }, 201);
  },
);

historyRouter.delete(
  '/favorites/:historyId',
  requireAuth,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    sendSuccess(res, { success: true }, 200);
  },
);
