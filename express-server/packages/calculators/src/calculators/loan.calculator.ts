import { z } from 'zod';
import { ValidationError } from '@packages/errors';
import { ICalculator, CalculatorMetadata, CalculatorCategory } from '../types/calculator.types.js';
import { loanInputSchema } from '../schemas/calculator.schemas.js';
import { toDecimal, roundDecimal, formatDecimal, Decimal } from '../utils/decimal.utils.js';

export type LoanInput = z.infer<typeof loanInputSchema>;

export interface PaymentScheduleItem {
  paymentNumber: number;
  paymentAmount: string;
  principal: string;
  interest: string;
  remainingBalance: string;
}

export interface LoanResult {
  principal: string;
  annualInterestRate: string;
  term: number;
  termUnit: string;
  paymentFrequency: string;
  periodicPayment: string;
  totalPayments: string;
  totalInterest: string;
  totalPrincipal: string;
  numberOfPayments: number;
  schedule?: PaymentScheduleItem[];
}

export class LoanCalculator implements ICalculator<LoanInput, LoanResult> {
  public readonly metadata: CalculatorMetadata = {
    id: 'loan',
    name: 'Loan Amortization Calculator',
    version: '1.0.0',
    description: 'Calculates periodic payments, total interest, and amortization schedule for a loan',
    category: CalculatorCategory.LOAN,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'],
  };

  public readonly inputSchema = loanInputSchema;

  public validateInput(input: unknown): LoanInput {
    const res = this.inputSchema.safeParse(input);
    if (!res.success) {
      throw new ValidationError('Invalid input for loan calculator', res.error.errors);
    }
    return res.data;
  }

  public calculate(input: LoanInput): LoanResult {
    const P = toDecimal(input.principal);
    const annualRate = toDecimal(input.annualInterestRate);

    let paymentsPerYear: number;
    switch (input.paymentFrequency) {
      case 'ANNUALLY':
        paymentsPerYear = 1;
        break;
      case 'BI_WEEKLY':
        paymentsPerYear = 26;
        break;
      case 'WEEKLY':
        paymentsPerYear = 52;
        break;
      case 'MONTHLY':
      default:
        paymentsPerYear = 12;
        break;
    }

    const termInYears = input.termUnit === 'MONTHS' ? toDecimal(input.term).dividedBy(12) : toDecimal(input.term);
    const totalPaymentsCountDec = termInYears.times(paymentsPerYear).round();
    const totalPaymentsCount = totalPaymentsCountDec.toNumber();

    if (totalPaymentsCount <= 0) {
      throw new ValidationError('Loan term results in 0 payments');
    }

    const periodicRate = annualRate.dividedBy(100).dividedBy(paymentsPerYear);

    let periodicPayment: Decimal;

    if (periodicRate.isZero()) {
      periodicPayment = P.dividedBy(totalPaymentsCountDec);
    } else {
      // M = P * [r(1+r)^N] / [(1+r)^N - 1]
      const onePlusRpowN = new Decimal(1).plus(periodicRate).pow(totalPaymentsCountDec);
      const numerator = P.times(periodicRate).times(onePlusRpowN);
      const denominator = onePlusRpowN.minus(1);
      periodicPayment = numerator.dividedBy(denominator);
    }

    const roundedPeriodicPayment = roundDecimal(periodicPayment, 2);

    let balance = P;
    const schedule: PaymentScheduleItem[] = [];
    let accumulatedInterest = new Decimal(0);
    let accumulatedPrincipal = new Decimal(0);

    for (let k = 1; k <= totalPaymentsCount; k++) {
      let interestForPeriod = balance.times(periodicRate);
      interestForPeriod = roundDecimal(interestForPeriod, 2);

      let principalForPeriod = roundedPeriodicPayment.minus(interestForPeriod);

      // Adjust last payment for exact zero balance rounding
      if (k === totalPaymentsCount || principalForPeriod.greaterThan(balance)) {
        principalForPeriod = balance;
      }

      balance = balance.minus(principalForPeriod);
      if (balance.lessThan(0)) balance = new Decimal(0);

      const actualPayment = principalForPeriod.plus(interestForPeriod);

      accumulatedInterest = accumulatedInterest.plus(interestForPeriod);
      accumulatedPrincipal = accumulatedPrincipal.plus(principalForPeriod);

      schedule.push({
        paymentNumber: k,
        paymentAmount: formatDecimal(actualPayment, 2),
        principal: formatDecimal(principalForPeriod, 2),
        interest: formatDecimal(interestForPeriod, 2),
        remainingBalance: formatDecimal(balance, 2),
      });
    }

    const totalPaymentsPaid = accumulatedPrincipal.plus(accumulatedInterest);

    return {
      principal: formatDecimal(P, 2),
      annualInterestRate: formatDecimal(annualRate, 2),
      term: input.term,
      termUnit: input.termUnit,
      paymentFrequency: input.paymentFrequency,
      periodicPayment: formatDecimal(roundedPeriodicPayment, 2),
      totalPayments: formatDecimal(totalPaymentsPaid, 2),
      totalInterest: formatDecimal(accumulatedInterest, 2),
      totalPrincipal: formatDecimal(accumulatedPrincipal, 2),
      numberOfPayments: totalPaymentsCount,
      schedule,
    };
  }
}
