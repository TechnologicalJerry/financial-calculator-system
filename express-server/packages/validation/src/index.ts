import { Request, Response, NextFunction } from 'express';
import { z, AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '@packages/errors';

export function validateBody(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError('Request body validation failed', error.errors));
      }
      next(error);
    }
  };
}

export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError('Request query validation failed', error.errors));
      }
      next(error);
    }
  };
}

export function validateParams(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError('Route parameters validation failed', error.errors));
      }
      next(error);
    }
  };
}

export function validateRequest(schemas: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError('Request validation failed', error.errors));
      }
      next(error);
    }
  };
}

// Stage 2 Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  currency: z.string().length(3).optional(),
  country: z.string().min(2).max(3).optional(),
  monthlyIncome: z.union([z.number().min(0), z.string()]).optional(),
  monthlyExpenses: z.union([z.number().min(0), z.string()]).optional(),
  riskTolerance: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  financialGoalSummary: z.string().nullable().optional(),
});

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['BANK_ACCOUNT', 'CASH', 'CREDIT_CARD', 'LOAN', 'INVESTMENT', 'RETIREMENT', 'OTHER']),
  institutionName: z.string().nullable().optional(),
  currency: z.string().length(3).default('USD'),
  balance: z.union([z.number(), z.string()]).default(0),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['BANK_ACCOUNT', 'CASH', 'CREDIT_CARD', 'LOAN', 'INVESTMENT', 'RETIREMENT', 'OTHER']).optional(),
  institutionName: z.string().nullable().optional(),
  currency: z.string().length(3).optional(),
  balance: z.union([z.number(), z.string()]).optional(),
  isActive: z.boolean().optional(),
});
