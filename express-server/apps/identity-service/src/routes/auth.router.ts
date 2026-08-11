import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import {
  validateBody,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '@packages/validation';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';
import { sendSuccess } from '@packages/http';

export const authRouter = Router();
const authService = new AuthService();

/**
 * POST /api/v1/auth/register
 */
authRouter.post(
  '/auth/register',
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.register(req.body);
      sendSuccess(res, user, 201);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/auth/login
 */
authRouter.post(
  '/auth/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/auth/refresh
 */
authRouter.post(
  '/auth/refresh',
  validateBody(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/auth/logout
 */
authRouter.post('/auth/logout', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.body?.refreshToken as string | undefined;
    const userId = (req as AuthenticatedRequest).user?.userId;
    const result = await authService.logout(refreshToken, userId);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/me
 */
authRouter.get(
  '/me',
  (req: Request, res: Response, next: NextFunction) => {
    const config = getConfig();
    authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
  },
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const user = await authService.getMe(userId);
      sendSuccess(res, user, 200);
    } catch (err) {
      next(err);
    }
  },
);
