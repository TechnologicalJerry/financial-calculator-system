import { z } from 'zod';

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  calculatorId: z.string().optional(),
  status: z.enum(['COMPLETED', 'FAILED']).optional(),
  currency: z.string().min(3).max(3).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'calculatorId', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
