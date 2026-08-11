import { z } from 'zod';
import { ValidationError } from '@packages/errors';
import { ICalculator, CalculatorMetadata, CalculatorCategory } from '../types/calculator.types.js';
import { savingsInputSchema } from '../schemas/calculator.schemas.js';
import { toDecimal, roundDecimal, formatDecimal, Decimal } from '../utils/decimal.utils.js';

export type SavingsInput = z.infer<typeof savingsInputSchema>;

export interface SavingsResult {
  initialSavings: string;
  periodicContribution: string;
  annualInterestRate: string;
  term: number;
  termUnit: string;
  contributionFrequency: string;
  compoundingFrequency: string;
  totalContributions: string;
  totalDeposited: string;
  interestEarned: string;
  finalBalance: string;
}

export class SavingsCalculator implements ICalculator<SavingsInput, SavingsResult> {
  public readonly metadata: CalculatorMetadata = {
    id: 'savings',
    name: 'Savings Growth Calculator',
    version: '1.0.0',
    description: 'Calculates savings accumulation over time with interest and regular deposits',
    category: CalculatorCategory.SAVINGS,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'],
  };

  public readonly inputSchema = savingsInputSchema;

  public validateInput(input: unknown): SavingsInput {
    const res = this.inputSchema.safeParse(input);
    if (!res.success) {
      throw new ValidationError('Invalid input for savings calculator', res.error.errors);
    }
    return res.data;
  }

  public calculate(input: SavingsInput): SavingsResult {
    const initial = toDecimal(input.initialSavings);
    const contribution = toDecimal(input.periodicContribution ?? 0);
    const ratePercent = toDecimal(input.annualInterestRate);
    const rAnnual = ratePercent.dividedBy(100);

    const termInYears = input.termUnit === 'MONTHS' ? toDecimal(input.term).dividedBy(12) : toDecimal(input.term);

    let contributionsPerYear: number;
    switch (input.contributionFrequency) {
      case 'ANNUALLY':
        contributionsPerYear = 1;
        break;
      case 'QUARTERLY':
        contributionsPerYear = 4;
        break;
      case 'SEMI_ANNUALLY':
        contributionsPerYear = 2;
        break;
      case 'MONTHLY':
      default:
        contributionsPerYear = 12;
        break;
    }

    let compoundingPerYear: number;
    switch (input.compoundingFrequency) {
      case 'ANNUALLY':
        compoundingPerYear = 1;
        break;
      case 'SEMI_ANNUALLY':
        compoundingPerYear = 2;
        break;
      case 'QUARTERLY':
        compoundingPerYear = 4;
        break;
      case 'MONTHLY':
      default:
        compoundingPerYear = 12;
        break;
    }

    const totalContributionsCount = termInYears.times(contributionsPerYear).round();
    const totalContributionsAmount = contribution.times(totalContributionsCount);
    const totalDeposited = initial.plus(totalContributionsAmount);

    const totalMonths = termInYears.times(12).round().toNumber();
    let balance = initial;
    const monthlyRate = rAnnual.dividedBy(compoundingPerYear);

    const monthsPerContribution = 12 / contributionsPerYear;
    const monthsPerCompounding = 12 / compoundingPerYear;

    for (let month = 1; month <= totalMonths; month++) {
      if ((month - 1) % monthsPerContribution === 0) {
        balance = balance.plus(contribution);
      }
      if (month % monthsPerCompounding === 0) {
        balance = balance.times(new Decimal(1).plus(monthlyRate));
      }
    }

    const finalBalance = roundDecimal(balance, 2);
    const interestEarned = finalBalance.minus(totalDeposited);

    return {
      initialSavings: formatDecimal(initial, 2),
      periodicContribution: formatDecimal(contribution, 2),
      annualInterestRate: formatDecimal(ratePercent, 2),
      term: input.term,
      termUnit: input.termUnit,
      contributionFrequency: input.contributionFrequency,
      compoundingFrequency: input.compoundingFrequency,
      totalContributions: formatDecimal(totalContributionsAmount, 2),
      totalDeposited: formatDecimal(totalDeposited, 2),
      interestEarned: formatDecimal(interestEarned, 2),
      finalBalance: formatDecimal(finalBalance, 2),
    };
  }
}
