import { z } from 'zod';
import { ValidationError } from '@packages/errors';
import { ICalculator, CalculatorMetadata, CalculatorCategory } from '../types/calculator.types.js';
import { compoundInterestInputSchema } from '../schemas/calculator.schemas.js';
import { toDecimal, roundDecimal, formatDecimal, Decimal } from '../utils/decimal.utils.js';

export type CompoundInterestInput = z.infer<typeof compoundInterestInputSchema>;

export interface CompoundInterestResult {
  principal: string;
  annualRate: string;
  term: number;
  termUnit: string;
  compoundingFrequency: string;
  interestEarned: string;
  finalAmount: string;
}

export class CompoundInterestCalculator implements ICalculator<CompoundInterestInput, CompoundInterestResult> {
  public readonly metadata: CalculatorMetadata = {
    id: 'compound-interest',
    name: 'Compound Interest Calculator',
    version: '1.0.0',
    description: 'Calculates investment growth over time with compound interest',
    category: CalculatorCategory.INTEREST,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'],
  };

  public readonly inputSchema = compoundInterestInputSchema;

  public validateInput(input: unknown): CompoundInterestInput {
    const res = this.inputSchema.safeParse(input);
    if (!res.success) {
      throw new ValidationError('Invalid input for compound interest calculator', res.error.errors);
    }
    return res.data;
  }

  public calculate(input: CompoundInterestInput): CompoundInterestResult {
    const P = toDecimal(input.principal);
    const ratePercent = toDecimal(input.annualRate);
    const r = ratePercent.dividedBy(100);

    const termInYears = input.termUnit === 'MONTHS' ? toDecimal(input.term).dividedBy(12) : toDecimal(input.term);

    let finalAmount: Decimal;

    if (input.compoundingFrequency === 'CONTINUOUS') {
      // A = P * e^(r * t)
      const exponent = r.times(termInYears);
      finalAmount = P.times(exponent.exp());
    } else {
      let n: number;
      switch (input.compoundingFrequency) {
        case 'ANNUALLY':
          n = 1;
          break;
        case 'SEMI_ANNUALLY':
          n = 2;
          break;
        case 'QUARTERLY':
          n = 4;
          break;
        case 'MONTHLY':
          n = 12;
          break;
        case 'DAILY':
          n = 365;
          break;
        default:
          n = 1;
      }

      const nDecimal = new Decimal(n);
      const nt = nDecimal.times(termInYears);
      const base = new Decimal(1).plus(r.dividedBy(nDecimal));
      finalAmount = P.times(base.pow(nt));
    }

    const interestEarned = finalAmount.minus(P);

    return {
      principal: formatDecimal(P, 2),
      annualRate: formatDecimal(ratePercent, 2),
      term: input.term,
      termUnit: input.termUnit,
      compoundingFrequency: input.compoundingFrequency,
      interestEarned: formatDecimal(roundDecimal(interestEarned, 2), 2),
      finalAmount: formatDecimal(roundDecimal(finalAmount, 2), 2),
    };
  }
}
