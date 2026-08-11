import { z } from 'zod';
import { ValidationError } from '@packages/errors';
import { ICalculator, CalculatorMetadata, CalculatorCategory } from '../types/calculator.types.js';
import { retirementInputSchema } from '../schemas/calculator.schemas.js';
import { toDecimal, roundDecimal, formatDecimal, Decimal } from '../utils/decimal.utils.js';

export type RetirementInput = z.infer<typeof retirementInputSchema>;

export interface RetirementResult {
  currentAge: number;
  retirementAge: number;
  yearsUntilRetirement: number;
  currentSavings: string;
  monthlyContribution: string;
  expectedAnnualReturn: string;
  expectedAnnualInflation: string;
  totalContributions: string;
  projectedRetirementSavings: string;
  estimatedInvestmentGrowth: string;
  inflationAdjustedValue: string;
  assumptions: string[];
}

export class RetirementCalculator implements ICalculator<RetirementInput, RetirementResult> {
  public readonly metadata: CalculatorMetadata = {
    id: 'retirement',
    name: 'Retirement Projection Calculator',
    version: '1.0.0',
    description: 'Projects retirement savings balance and inflation-adjusted purchasing power at retirement',
    category: CalculatorCategory.RETIREMENT,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'],
  };

  public readonly inputSchema = retirementInputSchema;

  public validateInput(input: unknown): RetirementInput {
    const res = this.inputSchema.safeParse(input);
    if (!res.success) {
      throw new ValidationError('Invalid input for retirement calculator', res.error.errors);
    }
    return res.data;
  }

  public calculate(input: RetirementInput): RetirementResult {
    const yearsUntilRetirement = input.retirementAge - input.currentAge;
    const currentSavings = toDecimal(input.currentSavings);
    const monthlyContribution = toDecimal(input.monthlyContribution ?? 0);
    const returnRatePercent = toDecimal(input.expectedAnnualReturn);
    const inflationRatePercent = toDecimal(input.expectedAnnualInflation ?? 0);

    const totalMonths = yearsUntilRetirement * 12;
    const monthlyReturnRate = returnRatePercent.dividedBy(100).dividedBy(12);

    let balance = currentSavings;
    for (let m = 1; m <= totalMonths; m++) {
      balance = balance.plus(monthlyContribution);
      balance = balance.times(new Decimal(1).plus(monthlyReturnRate));
    }

    const totalContributionsAmount = currentSavings.plus(monthlyContribution.times(totalMonths));
    const projectedRetirementSavings = roundDecimal(balance, 2);
    const estimatedInvestmentGrowth = projectedRetirementSavings.minus(totalContributionsAmount);

    // Inflation adjustment factor: (1 + i)^n
    const inflationFactor = new Decimal(1)
      .plus(inflationRatePercent.dividedBy(100))
      .pow(yearsUntilRetirement);

    const inflationAdjustedValue = roundDecimal(
      projectedRetirementSavings.dividedBy(inflationFactor),
      2,
    );

    const assumptions = [
      `Accumulation period: ${yearsUntilRetirement} years until retirement age ${input.retirementAge}`,
      `Monthly contributions compounded at ${formatDecimal(returnRatePercent, 2)}% annual return`,
      `Assumed annual inflation rate: ${formatDecimal(inflationRatePercent, 2)}%`,
      'Projections are mathematical estimates for planning purposes and do not represent guaranteed financial advice',
    ];

    return {
      currentAge: input.currentAge,
      retirementAge: input.retirementAge,
      yearsUntilRetirement,
      currentSavings: formatDecimal(currentSavings, 2),
      monthlyContribution: formatDecimal(monthlyContribution, 2),
      expectedAnnualReturn: formatDecimal(returnRatePercent, 2),
      expectedAnnualInflation: formatDecimal(inflationRatePercent, 2),
      totalContributions: formatDecimal(totalContributionsAmount, 2),
      projectedRetirementSavings: formatDecimal(projectedRetirementSavings, 2),
      estimatedInvestmentGrowth: formatDecimal(estimatedInvestmentGrowth, 2),
      inflationAdjustedValue: formatDecimal(inflationAdjustedValue, 2),
      assumptions,
    };
  }
}
