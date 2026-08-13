import { z } from 'zod';
import { validateBody } from '@packages/validation';
import { ValidationError } from '@packages/errors';
import { Request, Response, NextFunction } from 'express';

describe('Validation Utilities Unit Tests', () => {
  const schema = z.object({
    amount: z.number().positive(),
    currency: z.string().length(3),
  });

  const middleware = validateBody(schema);

  it('should call next() when request body matches Zod schema', async () => {
    const req = { body: { amount: 150.5, currency: 'USD' } } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ amount: 150.5, currency: 'USD' });
  });

  it('should pass ValidationError to next() when request body is invalid', async () => {
    const req = { body: { amount: -50, currency: 'INVALID' } } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });
});
