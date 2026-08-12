import { z } from 'zod';
import { createDecimalSchema } from '@packages/calculators';

export const portfolioStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);

export const investmentAccountTypeSchema = z.enum([
  'BROKERAGE',
  'RETIREMENT',
  'IRA',
  'ROTH_IRA',
  'PLAN_401K',
  'PENSION',
  'OTHER',
]);

export const investmentAccountStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'CLOSED']);

export const assetTypeSchema = z.enum([
  'STOCK',
  'ETF',
  'MUTUAL_FUND',
  'BOND',
  'REIT',
  'CRYPTO',
  'CASH',
  'OTHER',
]);

export const securityStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'DELISTED']);

export const transactionTypeSchema = z.enum([
  'BUY',
  'SELL',
  'DIVIDEND',
  'DEPOSIT',
  'WITHDRAWAL',
  'FEE',
  'INTEREST',
  'OTHER',
]);

// PORTFOLIO SCHEMAS
export const createPortfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
  description: z.string().optional(),
  baseCurrency: z.string().min(3).max(3).toUpperCase().default('USD'),
  status: portfolioStatusSchema.default('ACTIVE'),
});

export const updatePortfolioSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  baseCurrency: z.string().min(3).max(3).toUpperCase().optional(),
  status: portfolioStatusSchema.optional(),
});

export const portfolioQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: portfolioStatusSchema.optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// INVESTMENT ACCOUNT SCHEMAS
export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  accountType: investmentAccountTypeSchema.default('BROKERAGE'),
  brokerName: z.string().optional(),
  accountNumberMasked: z.string().optional(),
  currency: z.string().min(3).max(3).toUpperCase().default('USD'),
  status: investmentAccountStatusSchema.default('ACTIVE'),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  accountType: investmentAccountTypeSchema.optional(),
  brokerName: z.string().nullable().optional(),
  accountNumberMasked: z.string().nullable().optional(),
  currency: z.string().min(3).max(3).toUpperCase().optional(),
  status: investmentAccountStatusSchema.optional(),
});

export const accountQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: investmentAccountStatusSchema.optional(),
  accountType: investmentAccountTypeSchema.optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// SECURITY SCHEMAS
export const createSecuritySchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  name: z.string().min(1, 'Security name is required'),
  assetType: assetTypeSchema.default('STOCK'),
  exchange: z.string().optional(),
  currency: z.string().min(3).max(3).toUpperCase().default('USD'),
  isin: z.string().optional(),
  cusip: z.string().optional(),
  status: securityStatusSchema.default('ACTIVE'),
});

export const securityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  assetType: assetTypeSchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['symbol', 'name', 'createdAt']).default('symbol'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const createSecurityPriceSchema = z.object({
  price: createDecimalSchema({ min: 0, allowZero: false, message: 'Price must be greater than 0' }),
  currency: z.string().min(3).max(3).toUpperCase().default('USD'),
  priceDate: z.string().optional(),
  source: z.string().optional().default('MANUAL'),
});

// TRANSACTION SCHEMAS
export const buyTransactionSchema = z.object({
  investmentAccountId: z.string().uuid('Investment Account ID must be a valid UUID'),
  securityId: z.string().uuid('Security ID must be a valid UUID'),
  quantity: createDecimalSchema({ min: 0, allowZero: false, message: 'Quantity must be greater than 0' }),
  price: createDecimalSchema({ min: 0, allowZero: false, message: 'Price must be greater than 0' }),
  fees: createDecimalSchema({ min: 0, allowZero: true }).optional().default(0),
  taxes: createDecimalSchema({ min: 0, allowZero: true }).optional().default(0),
  transactionDate: z.string().optional(),
  description: z.string().optional(),
  referenceId: z.string().optional(),
});

export const sellTransactionSchema = z.object({
  investmentAccountId: z.string().uuid('Investment Account ID must be a valid UUID'),
  securityId: z.string().uuid('Security ID must be a valid UUID'),
  quantity: createDecimalSchema({ min: 0, allowZero: false, message: 'Quantity must be greater than 0' }),
  price: createDecimalSchema({ min: 0, allowZero: false, message: 'Price must be greater than 0' }),
  fees: createDecimalSchema({ min: 0, allowZero: true }).optional().default(0),
  taxes: createDecimalSchema({ min: 0, allowZero: true }).optional().default(0),
  transactionDate: z.string().optional(),
  description: z.string().optional(),
  referenceId: z.string().optional(),
});

export const dividendTransactionSchema = z.object({
  investmentAccountId: z.string().uuid('Investment Account ID must be a valid UUID'),
  securityId: z.string().uuid('Security ID must be a valid UUID'),
  amount: createDecimalSchema({ min: 0, allowZero: false, message: 'Dividend amount must be greater than 0' }),
  taxes: createDecimalSchema({ min: 0, allowZero: true }).optional().default(0),
  transactionDate: z.string().optional(),
  description: z.string().optional(),
  referenceId: z.string().optional(),
});

export const depositTransactionSchema = z.object({
  investmentAccountId: z.string().uuid('Investment Account ID must be a valid UUID'),
  amount: createDecimalSchema({ min: 0, allowZero: false, message: 'Deposit amount must be greater than 0' }),
  transactionDate: z.string().optional(),
  description: z.string().optional(),
  referenceId: z.string().optional(),
});

export const withdrawalTransactionSchema = z.object({
  investmentAccountId: z.string().uuid('Investment Account ID must be a valid UUID'),
  amount: createDecimalSchema({ min: 0, allowZero: false, message: 'Withdrawal amount must be greater than 0' }),
  transactionDate: z.string().optional(),
  description: z.string().optional(),
  referenceId: z.string().optional(),
});

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: transactionTypeSchema.optional(),
  securityId: z.string().uuid().optional(),
  investmentAccountId: z.string().uuid().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(['transactionDate', 'createdAt', 'totalAmount']).default('transactionDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const holdingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  investmentAccountId: z.string().uuid().optional(),
  securityId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'quantity', 'totalCost']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
