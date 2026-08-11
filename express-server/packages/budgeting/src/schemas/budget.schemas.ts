import { z } from 'zod';
import { createDecimalSchema } from '@packages/calculators';
import { toDecimal } from '@packages/calculators';

export const budgetPeriodSchema = z.enum([
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'CUSTOM',
]);

export const budgetStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']);

export const budgetCategoryTypeSchema = z.enum([
  'HOUSING',
  'FOOD',
  'TRANSPORTATION',
  'UTILITIES',
  'HEALTHCARE',
  'EDUCATION',
  'ENTERTAINMENT',
  'SHOPPING',
  'DEBT',
  'INSURANCE',
  'SAVINGS',
  'INVESTMENTS',
  'TRAVEL',
  'OTHER',
]);

export const goalCategorySchema = z.enum([
  'EMERGENCY_FUND',
  'HOME',
  'VEHICLE',
  'EDUCATION',
  'TRAVEL',
  'RETIREMENT',
  'DEBT_PAYOFF',
  'MAJOR_PURCHASE',
  'OTHER',
]);

export const goalStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED']);

export const allocationItemSchema = z.object({
  categoryId: z.string().uuid('Category ID must be a valid UUID'),
  limit: createDecimalSchema({ min: 0, allowZero: true, message: 'Allocation limit must be non-negative' }),
});

export const createBudgetSchema = z
  .object({
    name: z.string().min(1, 'Budget name is required'),
    description: z.string().optional(),
    currency: z.string().min(3).max(3).toUpperCase().default('USD'),
    period: budgetPeriodSchema.default('MONTHLY'),
    startDate: z.string().datetime({ message: 'Invalid start date ISO string' }).or(z.string().date()),
    endDate: z.string().datetime({ message: 'Invalid end date ISO string' }).or(z.string().date()),
    totalLimit: createDecimalSchema({ min: 0, allowZero: false, message: 'Total limit must be greater than 0' }),
    allocations: z.array(allocationItemSchema).optional().default([]),
  })
  .refine(
    (data) => new Date(data.startDate) <= new Date(data.endDate),
    { message: 'Start date must be less than or equal to end date', path: ['endDate'] },
  )
  .refine(
    (data) => {
      const total = toDecimal(data.totalLimit);
      const sumAllocated = data.allocations.reduce((acc, item) => acc.plus(toDecimal(item.limit)), toDecimal(0));
      return sumAllocated.lessThanOrEqualTo(total);
    },
    { message: 'Sum of category allocations cannot exceed total budget limit', path: ['allocations'] },
  );

export const updateBudgetSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    currency: z.string().min(3).max(3).toUpperCase().optional(),
    period: budgetPeriodSchema.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: budgetStatusSchema.optional(),
    totalLimit: createDecimalSchema({ min: 0, allowZero: false }).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: 'Start date must be less than or equal to end date', path: ['endDate'] },
  );

export const budgetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: budgetStatusSchema.optional(),
  period: budgetPeriodSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'startDate', 'endDate', 'totalLimit', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createExpenseSchema = z.object({
  amount: createDecimalSchema({ min: 0, allowZero: false, message: 'Expense amount must be greater than 0' }),
  currency: z.string().min(3).max(3).toUpperCase().default('USD'),
  categoryId: z.string().uuid('Category ID must be a valid UUID'),
  description: z.string().optional(),
  expenseDate: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  amount: createDecimalSchema({ min: 0, allowZero: false }).optional(),
  currency: z.string().min(3).max(3).toUpperCase().optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().nullable().optional(),
  expenseDate: z.string().optional(),
});

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(['expenseDate', 'createdAt', 'amount']).default('expenseDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: budgetCategoryTypeSchema.default('OTHER'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  type: budgetCategoryTypeSchema.optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

export const createGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  description: z.string().optional(),
  category: goalCategorySchema.default('OTHER'),
  targetAmount: createDecimalSchema({ min: 0, allowZero: false, message: 'Target amount must be greater than 0' }),
  currentAmount: createDecimalSchema({ min: 0, allowZero: true, message: 'Current amount must be non-negative' }).optional().default(0),
  currency: z.string().min(3).max(3).toUpperCase().default('USD'),
  targetDate: z.string().datetime({ message: 'Invalid target date ISO string' }).or(z.string().date()),
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: goalCategorySchema.optional(),
  targetAmount: createDecimalSchema({ min: 0, allowZero: false }).optional(),
  currentAmount: createDecimalSchema({ min: 0, allowZero: true }).optional(),
  currency: z.string().min(3).max(3).toUpperCase().optional(),
  targetDate: z.string().optional(),
  status: goalStatusSchema.optional(),
});

export const goalQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: goalStatusSchema.optional(),
  category: goalCategorySchema.optional(),
  targetDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'targetDate', 'targetAmount', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createContributionSchema = z.object({
  amount: createDecimalSchema({ min: 0, allowZero: false, message: 'Contribution amount must be greater than 0' }),
  currency: z.string().min(3).max(3).toUpperCase().default('USD'),
  contributionDate: z.string().optional(),
  description: z.string().optional(),
});

export const contributionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(['contributionDate', 'createdAt', 'amount']).default('contributionDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
