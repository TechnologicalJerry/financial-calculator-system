import { z } from 'zod';
import { ValidationError } from '@packages/errors';
import { ICalculator, CalculatorMetadata, CalculatorCategory } from '../types/calculator.types.js';
import { simpleInterestInputSchema } from '../schemas/calculator.schemas.js';
import { toDecimal, roundDecimal, formatDecimal } from '../utils/decimal.utils.js';

export type SimpleInterestInput = z.infer<typeof simpleInterestInputSchema>;

export interface SimpleInterestResult {
  principal: string;
  annualRate: string;
  term: number;
  termUnit: string;
  interestEarned: string;
  finalAmount: string;
}

export class SimpleInterestCalculator implements ICalculator<SimpleInterestInput, SimpleInterestResult> {
  public readonly metadata: CalculatorMetadata = {
    id: 'simple-interest',
    name: 'Simple Interest Calculator',
    version: '1.0.0',
    description: 'Calculates simple interest on principal over time without compounding',
    category: CalculatorCategory.INTEREST,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'],
  };

  public readonly inputSchema = simpleInterestInputSchema;

  public validateInput(input: unknown): SimpleInterestInput {
    const res = this.inputSchema.safeParse(input);
    if (!res.success) {
      throw new ValidationError('Invalid input for simple interest calculator', res.error.errors);
    }
    return res.data;
  }

  public calculate(input: SimpleInterestInput): SimpleInterestResult {
    const P = toDecimal(input.principal);
    const ratePercent = toDecimal(input.annualRate);
    const r = ratePercent.dividedBy(100);

    const termInYears = input.termUnit === 'MONTHS' ? toDecimal(input.term).dividedBy(12) : toDecimal(input.term);

    // I = P * r * t
    const interestEarned = P.times(r).times(termInYears);
    const finalAmount = P.plus(interestEarned);

    return {
      principal: formatDecimal(P, 2),
      annualRate: formatDecimal(ratePercent, 2),
      term: input.term,
      termUnit: input.termUnit,
      interestEarned: formatDecimal(roundDecimal(interestEarned, 2), 2),
      finalAmount: formatDecimal(roundDecimal(finalAmount, 2), 2),
    };
  }
}
