import { Router, Request, Response, NextFunction } from 'express';
import { securityService } from '../services/security.service.js';
import { sendSuccess } from '@packages/http';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';

export const securityRouter = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

securityRouter.get(
  '/securities',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await securityService.listSecurities(req.query);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },
);

securityRouter.get(
  '/securities/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const security = await securityService.getSecurityDetail(id);
      sendSuccess(res, security, 200);
    } catch (err) {
      next(err);
    }
  },
);

securityRouter.post(
  '/securities',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const security = await securityService.createSecurity(req.body);
      sendSuccess(res, security, 201);
    } catch (err) {
      next(err);
    }
  },
);

securityRouter.post(
  '/securities/:securityId/prices',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const securityId = req.params['securityId'] as string;
      const price = await securityService.addSecurityPrice(securityId, req.body);
      sendSuccess(res, price, 201);
    } catch (err) {
      next(err);
    }
  },
);
