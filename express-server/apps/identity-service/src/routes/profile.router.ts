import { Router, Request, Response, NextFunction } from 'express';
import { FinancialProfileService } from '../services/financial-profile.service.js';
import { validateBody, updateProfileSchema } from '@packages/validation';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';
import { sendSuccess } from '@packages/http';

export const profileRouter = Router();
const profileService = new FinancialProfileService();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

/**
 * GET /api/v1/profile
 */
profileRouter.get(
  '/profile',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const data = await profileService.getProfile(userId);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/v1/profile
 */
profileRouter.patch(
  '/profile',
  requireAuth,
  validateBody(updateProfileSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const updated = await profileService.updateProfile(userId, req.body);
      sendSuccess(res, updated, 200);
    } catch (err) {
      next(err);
    }
  },
);
