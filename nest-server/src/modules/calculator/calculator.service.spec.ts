import { describe, it, expect, beforeEach } from 'vitest';
import { CalculatorService } from './calculator.service';
import { DecimalUtils } from '../../common/utils/decimal.utils';

describe('CalculatorService (Vitest Unit Tests)', () => {
  let service: CalculatorService;

  beforeEach(() => {
    service = new CalculatorService();
  });

  it('should calculate compound interest accurately', () => {
    const res = service.calculateCompoundInterest({
      principal: 10000,
      annualRate: 7.5,
      years: 10,
      compoundingFrequency: 12,
    });

    expect(res.success).toBe(true);
    expect(res.data.futureValue).toBeGreaterThan(10000);
    const expectedInterest = DecimalUtils.round(res.data.futureValue - 10000);
    expect(res.data.totalInterest).toBe(expectedInterest);
  });

  it('should calculate loan amortization schedule correctly', () => {
    const res = service.calculateLoanAmortization({
      loanAmount: 250000,
      annualInterestRate: 6.5,
      termYears: 30,
    });

    expect(res.success).toBe(true);
    expect(res.data.monthlyPayment).toBeGreaterThan(0);
    expect(res.data.totalPayment).toBeGreaterThan(250000);
    expect(res.data.scheduleSample.length).toBeGreaterThan(0);
  });

  it('should calculate mortgage payments with tax and insurance', () => {
    const res = service.calculateMortgage({
      homePrice: 400000,
      downPayment: 80000,
      annualInterestRate: 6.5,
      termYears: 30,
      propertyTaxRate: 1.2,
      homeInsuranceAnnual: 1200,
    });

    expect(res.success).toBe(true);
    expect(res.data.loanAmount).toBe(320000);
    expect(res.data.totalMonthlyPayment).toBeGreaterThan(res.data.principalAndInterest);
  });

  it('should calculate retirement FIRE targets', () => {
    const res = service.calculateRetirement({
      currentAge: 30,
      retirementAge: 60,
      currentSavings: 50000,
      monthlyContribution: 1000,
      expectedReturnRate: 8.0,
      inflationRate: 2.5,
      safeWithdrawalRate: 4.0,
    });

    expect(res.success).toBe(true);
    expect(res.data.yearsToRetire).toBe(30);
    expect(res.data.totalNestEggAtRetirement).toBeGreaterThan(50000);
  });

  it('should calculate SIP returns correctly', () => {
    const res = service.calculateSip({
      monthlyInvestment: 500,
      expectedCagr: 12.0,
      investmentYears: 15,
    });

    expect(res.success).toBe(true);
    expect(res.data.totalInvested).toBe(90000);
    expect(res.data.wealthGained).toBeGreaterThan(0);
  });

  it('should estimate progressive income tax', () => {
    const res = service.calculateTax({
      grossIncome: 95000,
      filingStatus: 'SINGLE',
    });

    expect(res.success).toBe(true);
    expect(res.data.taxableIncome).toBe(95000 - 13850);
    expect(res.data.totalEstimatedTax).toBeGreaterThan(0);
  });
});
