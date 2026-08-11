import { z } from 'zod';
import { ValidationError } from '@packages/errors';
import { ICalculator, CalculatorMetadata, CalculatorCategory } from '../types/calculator.types.js';
import { investmentInputSchema } from '../schemas/calculator.schemas.js';
import { toDecimal, roundDecimal, formatDecimal, Decimal } from '../utils/decimal.utils.js';

export type InvestmentInput = z.infer<typeof investmentInputSchema>;

export interface InvestmentResult {
  initialInvestment: string;
  periodicContribution: string;
  annualReturnRate: string;
  term: number;
  termUnit: string;
  contributionFrequency: string;
  compoundingFrequency: string;
  totalContributions: string;
  totalInvested: string;
  investmentGrowth: string;
  finalValue: string;
}

export class InvestmentCalculator implements ICalculator<InvestmentInput, InvestmentResult> {
  public readonly metadata: CalculatorMetadata = {
    id: 'investment',
    name: 'Investment Return Calculator',
    version: '1.0.0',
    description: 'Calculates portfolio growth and investment returns with recurring contributions',
    category: CalculatorCategory.INVESTMENT,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'],
  };

  public readonly inputSchema = investmentInputSchema;

  public validateInput(input: unknown): InvestmentInput {
    const res = this.inputSchema.safeParse(input);
    if (!res.success) {
      throw new ValidationError('Invalid input for investment calculator', res.error.errors);
    }
    return res.data;
  }

  public calculate(input: InvestmentInput): InvestmentResult {
    const initial = toDecimal(input.initialInvestment);
    const contribution = toDecimal(input.periodicContribution ?? 0);
    const returnRatePercent = toDecimal(input.annualReturnRate);
    const rAnnual = returnRatePercent.dividedBy(100);

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
    const totalInvested = initial.plus(totalContributionsAmount);

    // Period by period calculation per month (or sub-period) for precision
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

    const finalValue = roundDecimal(balance, 2);
    const investmentGrowth = finalValue.minus(totalInvested);

    return {
      initialInvestment: formatDecimal(initial, 2),
      periodicContribution: formatDecimal(contribution, 2),
      annualReturnRate: formatDecimal(returnRatePercent, 2),
      term: input.term,
      termUnit: input.termUnit,
      contributionFrequency: input.contributionFrequency,
      compoundingFrequency: input.compoundingFrequency,
      totalContributions: formatDecimal(totalContributionsAmount, 2),
      totalInvested: formatDecimal(totalInvested, 2),
      investmentGrowth: formatDecimal(investmentGrowth, 2),
      finalValue: formatDecimal(finalValue, 2),
    };
  }
}
