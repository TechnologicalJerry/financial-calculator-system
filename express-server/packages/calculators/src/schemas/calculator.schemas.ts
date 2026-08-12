import { z } from 'zod';
import { isValidDecimal, toDecimal } from '../utils/decimal.utils.js';

export const createDecimalSchema = (options: {
  min?: number;
  max?: number;
  allowZero?: boolean;
  message?: string;
} = {}) => {
  return z
    .union([z.number(), z.string()])
    .refine((val) => isValidDecimal(val), {
      message: options.message || 'Must be a valid decimal number',
    })
    .refine(
      (val) => {
        const d = toDecimal(val as number | string);
        if (options.allowZero === false && d.isZero()) return false;
        if (options.min !== undefined && d.lessThan(options.min)) return false;
        if (options.max !== undefined && d.greaterThan(options.max)) return false;
        return true;
      },
      {
        message:
          options.message ||
          `Value constraint failed (min: ${options.min ?? '-inf'}, max: ${options.max ?? 'inf'}, allowZero: ${options.allowZero ?? true})`,
      },
    );
};

export const termUnitSchema = z.enum(['YEARS', 'MONTHS']).default('YEARS');
export const compoundingFrequencySchema = z.enum([
  'ANNUALLY',
  'SEMI_ANNUALLY',
  'QUARTERLY',
  'MONTHLY',
  'DAILY',
  'CONTINUOUS',
]);
export const paymentFrequencySchema = z.enum(['ANNUALLY', 'MONTHLY', 'BI_WEEKLY', 'WEEKLY']);
export const contributionFrequencySchema = z.enum(['ANNUALLY', 'SEMI_ANNUALLY', 'QUARTERLY', 'MONTHLY']);
export const currencySchema = z.string().min(3).max(3).toUpperCase().default('USD');

// 1. Compound Interest Schema
export const compoundInterestInputSchema = z.object({
  principal: createDecimalSchema({ min: 0, allowZero: false, message: 'Principal must be a positive number greater than 0' }),
  annualRate: createDecimalSchema({ min: 0, allowZero: true, message: 'Annual interest rate must be non-negative' }),
  term: z.number().positive('Term must be a positive number'),
  termUnit: termUnitSchema,
  compoundingFrequency: compoundingFrequencySchema.default('ANNUALLY'),
  currency: currencySchema,
});

// 2. Simple Interest Schema
export const simpleInterestInputSchema = z.object({
  principal: createDecimalSchema({ min: 0, allowZero: false, message: 'Principal must be a positive number greater than 0' }),
  annualRate: createDecimalSchema({ min: 0, allowZero: true, message: 'Annual interest rate must be non-negative' }),
  term: z.number().positive('Term must be a positive number'),
  termUnit: termUnitSchema,
  currency: currencySchema,
});

// 3. Loan Schema
export const loanInputSchema = z.object({
  principal: createDecimalSchema({ min: 0, allowZero: false, message: 'Principal must be a positive number greater than 0' }),
  annualInterestRate: createDecimalSchema({ min: 0, allowZero: true, message: 'Annual interest rate must be non-negative' }),
  term: z.number().positive('Term must be a positive number'),
  termUnit: termUnitSchema,
  paymentFrequency: paymentFrequencySchema.default('MONTHLY'),
  currency: currencySchema,
});

// 4. Mortgage Schema
export const mortgageInputSchema = z
  .object({
    homePrice: createDecimalSchema({ min: 0, allowZero: false, message: 'Home price must be a positive number greater than 0' }),
    downPayment: createDecimalSchema({ min: 0, allowZero: true, message: 'Down payment must be non-negative' }).optional().default(0),
    loanAmount: createDecimalSchema({ min: 0, allowZero: false, message: 'Loan amount must be positive' }).optional(),
    annualInterestRate: createDecimalSchema({ min: 0, allowZero: true, message: 'Annual interest rate must be non-negative' }),
    loanTerm: z.number().positive('Loan term must be a positive number of years'),
    paymentFrequency: paymentFrequencySchema.default('MONTHLY'),
    propertyTax: createDecimalSchema({ min: 0, allowZero: true, message: 'Property tax must be non-negative' }).optional().default(0),
    homeInsurance: createDecimalSchema({ min: 0, allowZero: true, message: 'Home insurance must be non-negative' }).optional().default(0),
    pmi: createDecimalSchema({ min: 0, allowZero: true, message: 'PMI must be non-negative' }).optional().default(0),
    hoa: createDecimalSchema({ min: 0, allowZero: true, message: 'HOA fee must be non-negative' }).optional().default(0),
    currency: currencySchema,
  })
  .refine(
    (data) => {
      const price = toDecimal(data.homePrice);
      const dp = toDecimal(data.downPayment ?? 0);
      return dp.lessThanOrEqualTo(price);
    },
    { message: 'Down payment cannot be greater than home price', path: ['downPayment'] },
  );

// 5. Investment Calculator Schema
export const investmentInputSchema = z.object({
  initialInvestment: createDecimalSchema({ min: 0, allowZero: true, message: 'Initial investment must be non-negative' }),
  periodicContribution: createDecimalSchema({ min: 0, allowZero: true, message: 'Periodic contribution must be non-negative' }).default(0),
  annualReturnRate: createDecimalSchema({ message: 'Annual return rate must be a valid decimal number' }),
  term: z.number().positive('Term must be a positive number'),
  termUnit: termUnitSchema,
  contributionFrequency: contributionFrequencySchema.default('MONTHLY'),
  compoundingFrequency: compoundingFrequencySchema.default('ANNUALLY'),
  currency: currencySchema,
});

// 6. Savings Calculator Schema
export const savingsInputSchema = z.object({
  initialSavings: createDecimalSchema({ min: 0, allowZero: true, message: 'Initial savings must be non-negative' }),
  periodicContribution: createDecimalSchema({ min: 0, allowZero: true, message: 'Periodic contribution must be non-negative' }).default(0),
  annualInterestRate: createDecimalSchema({ min: 0, allowZero: true, message: 'Annual interest rate must be non-negative' }),
  term: z.number().positive('Term must be a positive number'),
  termUnit: termUnitSchema,
  contributionFrequency: contributionFrequencySchema.default('MONTHLY'),
  compoundingFrequency: compoundingFrequencySchema.default('ANNUALLY'),
  currency: currencySchema,
});

// 7. Retirement Calculator Schema
export const retirementInputSchema = z
  .object({
    currentAge: z.number().int().min(1, 'Current age must be at least 1').max(120, 'Current age is invalid'),
    retirementAge: z.number().int().min(1, 'Retirement age must be at least 1').max(120, 'Retirement age is invalid'),
    currentSavings: createDecimalSchema({ min: 0, allowZero: true, message: 'Current savings must be non-negative' }),
    monthlyContribution: createDecimalSchema({ min: 0, allowZero: true, message: 'Monthly contribution must be non-negative' }).default(0),
    expectedAnnualReturn: createDecimalSchema({ message: 'Expected annual return must be a valid decimal number' }),
    expectedAnnualInflation: createDecimalSchema({ min: 0, allowZero: true, message: 'Expected annual inflation must be non-negative' }).optional().default(0),
    retirementYears: z.number().int().positive('Retirement years must be a positive integer').optional().default(25),
    currency: currencySchema,
  })
  .refine((data) => data.retirementAge > data.currentAge, {
    message: 'Retirement age must be greater than current age',
    path: ['retirementAge'],
  });
