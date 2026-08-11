import { z } from 'zod';

export const reportTypeSchema = z.enum([
  'FINANCIAL_SUMMARY',
  'BUDGET_REPORT',
  'GOAL_REPORT',
  'INVESTMENT_REPORT',
  'NET_WORTH_REPORT',
]);

export const netWorthHistoryQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
});

export const expenseAnalyticsQuerySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  category: z.string().optional(),
  budgetId: z.string().uuid().optional(),
});

export const incomeAnalyticsQuerySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const cashFlowQuerySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const investmentPerformanceQuerySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  portfolioId: z.string().uuid().optional(),
});

export const createReportSchema = z.object({
  reportType: reportTypeSchema,
  title: z.string().min(1, 'Report title is required'),
  parameters: z.record(z.unknown()).optional(),
});

export const reportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  reportType: reportTypeSchema.optional(),
  sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
