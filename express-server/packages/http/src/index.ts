import express, { Express, Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'crypto';
import { AppError, InternalServerError, ErrorCode } from '@packages/errors';
import { getLogger } from '@packages/logger';
import { healthRouter } from '@packages/observability';
import { authRouter, profileRouter, accountsRouter } from '@apps/identity-service';
import { calculatorRouter, historyRouter } from '@packages/calculators';
import { budgetRouter, goalRouter } from '@packages/budgeting';
import {
  portfolioRouter,
  accountRouter as investmentAccountRouter,
  securityRouter,
  holdingRouter,
  transactionRouter,
} from '@packages/investments';
import { analyticsRouter } from '@packages/analytics';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      correlationId?: string;
    }
  }
}

export function requestIdMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const existingReqId = req.headers['x-request-id'] as string | undefined;
    const reqId = existingReqId || randomUUID();
    req.id = reqId;
    res.setHeader('x-request-id', reqId);

    const existingCorrId = req.headers['x-correlation-id'] as string | undefined;
    const corrId = existingCorrId || reqId;
    req.correlationId = corrId;
    res.setHeader('x-correlation-id', corrId);

    next();
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 500,
  requestId?: string,
  details?: unknown,
): Response {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(requestId ? { requestId } : {}),
      ...(details !== undefined ? { details } : {}),
    },
  });
}

export function errorHandlerMiddleware(): ErrorRequestHandler {
  return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    const logger = getLogger();
    const requestId = req.id ? String(req.id) : (req.headers['x-request-id'] as string | undefined);

    if (err instanceof AppError) {
      if (!err.isOperational) {
        logger.error({ err, requestId }, 'Non-operational AppError occurred');
      } else {
        logger.warn({ err, requestId }, 'Operational AppError');
      }

      res.status(err.statusCode).json(err.toJSON(requestId, process.env['NODE_ENV'] === 'development'));
      return;
    }

    // Unhandled / Unknown errors
    logger.error({ err, requestId, stack: err.stack }, 'Unhandled Server Error');

    const internalError = new InternalServerError('An unexpected error occurred');
    res.status(internalError.statusCode).json(
      internalError.toJSON(requestId, process.env['NODE_ENV'] === 'development'),
    );
  };
}

export interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
}

export function createRateLimiter(options: RateLimiterOptions = {}): RequestHandler {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const maxRequests = options.maxRequests || 1000;
  const hits = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (process.env['NODE_ENV'] === 'test') {
      next();
      return;
    }
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const record = hits.get(ip);

    if (!record || now > record.resetTime) {
      hits.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    record.count += 1;
    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.',
        },
      });
      return;
    }

    next();
  };
}

export interface AppFactoryOptions {
  corsOptions?: CorsOptions;
  bodyLimit?: string;
  rateLimiterOptions?: RateLimiterOptions;
}

export function createApp(options: AppFactoryOptions = {}): Express {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(cors(options.corsOptions));
  app.use(createRateLimiter(options.rateLimiterOptions));

  // Request ID & Correlation ID
  app.use(requestIdMiddleware());

  // Body Parsing
  const limit = options.bodyLimit || '1mb';
  app.use(express.json({ limit }));
  app.use(express.urlencoded({ extended: true, limit }));

  // Pino HTTP Logger
  if (process.env['NODE_ENV'] !== 'test') {
    app.use(
      pinoHttp({
        logger: getLogger(),
        customProps: (req) => ({
          requestId: (req as Request).id ? String((req as Request).id) : undefined,
          correlationId: (req as Request).correlationId ? String((req as Request).correlationId) : undefined,
        }),
      }),
    );
  }

  // API v1 Routes
  const apiV1Router = express.Router();
  apiV1Router.use('/', healthRouter);
  apiV1Router.use('/', authRouter);
  apiV1Router.use('/', profileRouter);
  apiV1Router.use('/', accountsRouter);
  apiV1Router.use('/', calculatorRouter);
  apiV1Router.use('/', historyRouter);
  apiV1Router.use('/', budgetRouter);
  apiV1Router.use('/', goalRouter);
  apiV1Router.use('/', portfolioRouter);
  apiV1Router.use('/', investmentAccountRouter);
  apiV1Router.use('/', securityRouter);
  apiV1Router.use('/', holdingRouter);
  apiV1Router.use('/', transactionRouter);
  apiV1Router.use('/', analyticsRouter);

  app.use('/api/v1', apiV1Router);

  // 404 Route Handler
  app.use((req: Request, res: Response): void => {
    sendError(
      res,
      ErrorCode.NOT_FOUND_ERROR,
      `Route ${req.method} ${req.originalUrl} not found`,
      404,
      req.id ? String(req.id) : undefined,
    );
  });

  // Centralized Error Handling Middleware
  app.use(errorHandlerMiddleware());

  return app;
}
