import { Router, Request, Response, NextFunction } from 'express';
import { calculatorService } from '../services/calculator.service.js';
import { calculationHistoryService } from '../services/calculation-history.service.js';
import { sendSuccess } from '@packages/http';
import { optionalAuthenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';

export const calculatorRouter = Router();

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  optionalAuthenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

/**
 * GET /api/v1/calculators
 * Lists metadata for all available financial calculators.
 */
calculatorRouter.get(
  '/calculators',
  optionalAuth,
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const calculators = calculatorService.listCalculators();
      sendSuccess(res, calculators, 200);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v1/calculators/:calculatorId
 * Retrieves metadata for a specific calculator by ID.
 */
calculatorRouter.get(
  '/calculators/:calculatorId',
  optionalAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const calculatorId = req.params['calculatorId'] as string;
      const metadata = calculatorService.getCalculatorMetadata(calculatorId);
      sendSuccess(res, metadata, 200);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/calculators/:calculatorId/calculate
 * Executes calculation for a specific calculator by ID and persists history if authenticated.
 */
calculatorRouter.post(
  '/calculators/:calculatorId/calculate',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const calculatorId = req.params['calculatorId'] as string;
      const userId = req.user?.userId;
      const response = await calculationHistoryService.executeAndPersist(
        calculatorId,
        req.body,
        userId,
        req.correlationId,
      );
      sendSuccess(res, response, 200);
    } catch (err) {
      next(err);
    }
  },
);
