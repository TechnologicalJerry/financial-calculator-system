import { z } from 'zod';
import { ValidationError } from '@packages/errors';
import { ICalculator, CalculatorMetadata, CalculatorCategory } from '../types/calculator.types.js';
import { mortgageInputSchema } from '../schemas/calculator.schemas.js';
import { toDecimal, roundDecimal, formatDecimal, Decimal } from '../utils/decimal.utils.js';
import { PaymentScheduleItem } from './loan.calculator.js';

export type MortgageInput = z.infer<typeof mortgageInputSchema>;

export interface MortgageResult {
  homePrice: string;
  downPayment: string;
  loanAmount: string;
  annualInterestRate: string;
  loanTermYears: number;
  paymentFrequency: string;
  periodicPrincipalAndInterest: string;
  estimatedTaxes: string;
  estimatedInsurance: string;
  estimatedPmi: string;
  estimatedHoa: string;
  totalPeriodicPayment: string;
  totalInterest: string;
  totalAmountPaid: string;
  schedule?: PaymentScheduleItem[];
}

export class MortgageCalculator implements ICalculator<MortgageInput, MortgageResult> {
  public readonly metadata: CalculatorMetadata = {
    id: 'mortgage',
    name: 'Mortgage Calculator',
    version: '1.0.0',
    description: 'Calculates home loan payments including P&I, property tax, insurance, PMI, and HOA fees',
    category: CalculatorCategory.MORTGAGE,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'],
  };

  public readonly inputSchema = mortgageInputSchema;

  public validateInput(input: unknown): MortgageInput {
    const res = this.inputSchema.safeParse(input);
    if (!res.success) {
      throw new ValidationError('Invalid input for mortgage calculator', res.error.errors);
    }
    return res.data;
  }

  public calculate(input: MortgageInput): MortgageResult {
    const homePrice = toDecimal(input.homePrice);
    const downPayment = toDecimal(input.downPayment ?? 0);

    let loanAmount: Decimal;
    if (input.loanAmount !== undefined && input.loanAmount !== null) {
      loanAmount = toDecimal(input.loanAmount);
    } else {
      loanAmount = homePrice.minus(downPayment);
    }

    if (loanAmount.lessThanOrEqualTo(0)) {
      throw new ValidationError('Loan amount must be greater than 0 (down payment equals or exceeds home price)');
    }

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

    const totalPaymentsCount = new Decimal(input.loanTerm).times(paymentsPerYear).toNumber();
    const periodicRate = annualRate.dividedBy(100).dividedBy(paymentsPerYear);

    let periodicPI: Decimal;
    if (periodicRate.isZero()) {
      periodicPI = loanAmount.dividedBy(totalPaymentsCount);
    } else {
      const onePlusRpowN = new Decimal(1).plus(periodicRate).pow(totalPaymentsCount);
      const numerator = loanAmount.times(periodicRate).times(onePlusRpowN);
      const denominator = onePlusRpowN.minus(1);
      periodicPI = numerator.dividedBy(denominator);
    }

    const roundedPeriodicPI = roundDecimal(periodicPI, 2);

    // Additional periodic costs
    const annualPropertyTax = toDecimal(input.propertyTax ?? 0);
    const periodicTax = roundDecimal(annualPropertyTax.dividedBy(paymentsPerYear), 2);

    const annualInsurance = toDecimal(input.homeInsurance ?? 0);
    const periodicInsurance = roundDecimal(annualInsurance.dividedBy(paymentsPerYear), 2);

    const annualPmi = toDecimal(input.pmi ?? 0);
    const periodicPmi = roundDecimal(annualPmi.dividedBy(paymentsPerYear), 2);

    const monthlyHoa = toDecimal(input.hoa ?? 0);
    const annualHoa = monthlyHoa.times(12);
    const periodicHoa = roundDecimal(annualHoa.dividedBy(paymentsPerYear), 2);

    const totalPeriodicPayment = roundedPeriodicPI
      .plus(periodicTax)
      .plus(periodicInsurance)
      .plus(periodicPmi)
      .plus(periodicHoa);

    // Amortization schedule for P&I
    let balance = loanAmount;
    const schedule: PaymentScheduleItem[] = [];
    let accumulatedInterest = new Decimal(0);

    for (let k = 1; k <= totalPaymentsCount; k++) {
      let interestForPeriod = roundDecimal(balance.times(periodicRate), 2);
      let principalForPeriod = roundedPeriodicPI.minus(interestForPeriod);

      if (k === totalPaymentsCount || principalForPeriod.greaterThan(balance)) {
        principalForPeriod = balance;
      }

      balance = balance.minus(principalForPeriod);
      if (balance.lessThan(0)) balance = new Decimal(0);

      accumulatedInterest = accumulatedInterest.plus(interestForPeriod);

      schedule.push({
        paymentNumber: k,
        paymentAmount: formatDecimal(principalForPeriod.plus(interestForPeriod), 2),
        principal: formatDecimal(principalForPeriod, 2),
        interest: formatDecimal(interestForPeriod, 2),
        remainingBalance: formatDecimal(balance, 2),
      });
    }

    const totalPIPaid = loanAmount.plus(accumulatedInterest);
    const totalExtraCostsPaid = periodicTax
      .plus(periodicInsurance)
      .plus(periodicPmi)
      .plus(periodicHoa)
      .times(totalPaymentsCount);

    const totalAmountPaid = totalPIPaid.plus(totalExtraCostsPaid).plus(downPayment);

    return {
      homePrice: formatDecimal(homePrice, 2),
      downPayment: formatDecimal(downPayment, 2),
      loanAmount: formatDecimal(loanAmount, 2),
      annualInterestRate: formatDecimal(annualRate, 2),
      loanTermYears: input.loanTerm,
      paymentFrequency: input.paymentFrequency,
      periodicPrincipalAndInterest: formatDecimal(roundedPeriodicPI, 2),
      estimatedTaxes: formatDecimal(periodicTax, 2),
      estimatedInsurance: formatDecimal(periodicInsurance, 2),
      estimatedPmi: formatDecimal(periodicPmi, 2),
      estimatedHoa: formatDecimal(periodicHoa, 2),
      totalPeriodicPayment: formatDecimal(totalPeriodicPayment, 2),
      totalInterest: formatDecimal(accumulatedInterest, 2),
      totalAmountPaid: formatDecimal(roundDecimal(totalAmountPaid, 2), 2),
      schedule,
    };
  }
}
