import { Injectable } from '@nestjs/common';
import { DecimalUtils } from '../../common/utils/decimal.utils';
import { CompoundInterestDto } from './dto/compound-interest.dto';
import { LoanAmortizationDto } from './dto/loan-amortization.dto';
import { MortgageDto } from './dto/mortgage.dto';
import { RetirementDto } from './dto/retirement.dto';
import { SipDto } from './dto/sip.dto';
import { TvmDto } from './dto/tvm.dto';
import { TaxEstimatorDto } from './dto/tax-estimator.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Injectable()
export class CalculatorService {

  /** 1. Compound Interest Calculator */
  calculateCompoundInterest(dto: CompoundInterestDto) {
    const P = DecimalUtils.toDecimal(dto.principal);
    const r = DecimalUtils.divide(dto.annualRate, 100);
    const n = dto.compoundingFrequency;
    const t = dto.years;

    const ratePerPeriod = DecimalUtils.divide(r, n);
    const totalPeriods = n * t;

    const factor = DecimalUtils.pow(DecimalUtils.add(1, ratePerPeriod), totalPeriods);
    const futureValue = DecimalUtils.multiply(P, factor);
    const totalInterest = DecimalUtils.subtract(futureValue, P);

    return ApiResponse.ok({
      principal: DecimalUtils.round(P),
      futureValue: DecimalUtils.round(futureValue),
      totalInterest: DecimalUtils.round(totalInterest),
      years: t,
      annualRate: dto.annualRate,
      compoundingFrequency: n,
    }, 'Compound interest calculated successfully');
  }

  /** 2. Loan Amortization Schedule */
  calculateLoanAmortization(dto: LoanAmortizationDto) {
    const P = DecimalUtils.toDecimal(dto.loanAmount);
    const monthlyRate = DecimalUtils.divide(DecimalUtils.divide(dto.annualInterestRate, 100), 12);
    const totalPayments = dto.termYears * 12;

    const factor = DecimalUtils.pow(DecimalUtils.add(1, monthlyRate), totalPayments);
    const numerator = DecimalUtils.multiply(monthlyRate, factor);
    const denominator = DecimalUtils.subtract(factor, 1);

    const monthlyPayment = DecimalUtils.multiply(P, DecimalUtils.divide(numerator, denominator));

    let balance = P;
    const schedule: any[] = [];
    let totalInterestPaid = DecimalUtils.toDecimal(0);

    for (let period = 1; period <= totalPayments; period++) {
      const interestPaid = DecimalUtils.multiply(balance, monthlyRate);
      const principalPaid = DecimalUtils.subtract(monthlyPayment, interestPaid);
      balance = DecimalUtils.subtract(balance, principalPaid);
      totalInterestPaid = DecimalUtils.add(totalInterestPaid, interestPaid);

      if (period <= 12 || period % 12 === 0 || period === totalPayments) {
        schedule.push({
          periodNumber: period,
          monthlyPayment: DecimalUtils.round(monthlyPayment),
          principalPaid: DecimalUtils.round(principalPaid),
          interestPaid: DecimalUtils.round(interestPaid),
          remainingBalance: Math.max(0, DecimalUtils.round(balance)),
        });
      }
    }

    return ApiResponse.ok({
      loanAmount: DecimalUtils.round(P),
      monthlyPayment: DecimalUtils.round(monthlyPayment),
      totalPayment: DecimalUtils.round(DecimalUtils.add(P, totalInterestPaid)),
      totalInterestPaid: DecimalUtils.round(totalInterestPaid),
      termYears: dto.termYears,
      annualInterestRate: dto.annualInterestRate,
      scheduleSample: schedule,
    }, 'Loan amortization schedule calculated successfully');
  }

  /** 3. Mortgage Payment Calculator */
  calculateMortgage(dto: MortgageDto) {
    const loanAmount = dto.homePrice - dto.downPayment;
    const monthlyRate = (dto.annualInterestRate / 100) / 12;
    const totalPayments = dto.termYears * 12;

    const factor = Math.pow(1 + monthlyRate, totalPayments);
    const principalAndInterest = (loanAmount * (monthlyRate * factor)) / (factor - 1);

    const monthlyPropertyTax = ((dto.homePrice * ((dto.propertyTaxRate || 1.2) / 100)) / 12);
    const monthlyHomeInsurance = ((dto.homeInsuranceAnnual || 1200) / 12);
    
    // PMI if down payment < 20%
    const downPaymentRatio = dto.downPayment / dto.homePrice;
    const monthlyPmi = downPaymentRatio < 0.20 ? ((loanAmount * ((dto.pmiRate || 0.5) / 100)) / 12) : 0;

    const totalMonthlyPayment = principalAndInterest + monthlyPropertyTax + monthlyHomeInsurance + monthlyPmi;

    return ApiResponse.ok({
      homePrice: dto.homePrice,
      downPayment: dto.downPayment,
      loanAmount,
      principalAndInterest: DecimalUtils.round(principalAndInterest),
      monthlyPropertyTax: DecimalUtils.round(monthlyPropertyTax),
      monthlyHomeInsurance: DecimalUtils.round(monthlyHomeInsurance),
      monthlyPmi: DecimalUtils.round(monthlyPmi),
      totalMonthlyPayment: DecimalUtils.round(totalMonthlyPayment),
    }, 'Mortgage payment calculated successfully');
  }

  /** 4. Retirement & FIRE Calculator */
  calculateRetirement(dto: any) {
    const currentAge = dto.currentAge ?? 30;
    const targetRetirementAge = dto.targetRetirementAge ?? dto.retirementAge ?? 60;
    const yearsToRetirement = Math.max(1, targetRetirementAge - currentAge);
    const annualExpense = dto.currentAnnualExpense ?? 50000;
    const inflationRate = dto.expectedInflationRate ?? 3;
    const swr = dto.safeWithdrawalRate ?? 4;

    const futureAnnualExpense = annualExpense * Math.pow(1 + inflationRate / 100, yearsToRetirement);
    const fireNumber = futureAnnualExpense / (swr / 100);
    
    // Estimated required monthly savings assuming 7% return rate
    const r = (7 / 100) / 12;
    const n = yearsToRetirement * 12;
    const requiredMonthlySavings = r > 0 ? fireNumber * r / (Math.pow(1 + r, n) - 1) : fireNumber / n;

    return ApiResponse.ok({
      fireNumber: DecimalUtils.round(fireNumber),
      yearsToRetire: yearsToRetirement,
      yearsToRetirement,
      futureAnnualExpense: DecimalUtils.round(futureAnnualExpense),
      requiredMonthlySavings: DecimalUtils.round(requiredMonthlySavings),
      totalNestEggAtRetirement: DecimalUtils.round(fireNumber),
      annualRetirementIncome: DecimalUtils.round(futureAnnualExpense),
      monthlyRetirementIncome: DecimalUtils.round(futureAnnualExpense / 12),
      safeWithdrawalRate: swr,
    }, 'Retirement & FIRE projection calculated successfully');
  }

  /** 5. SIP (Systematic Investment Plan) Calculator */
  calculateSip(dto: any) {
    const P = dto.monthlyInvestment ?? dto.principal ?? 0;
    const rate = dto.expectedReturnRate ?? dto.expectedCagr ?? 0;
    const years = dto.tenureYears ?? dto.investmentYears ?? 0;
    const i = (rate / 100) / 12;
    const n = years * 12;

    const futureValue = i > 0 ? P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i) : P * n;
    const totalInvested = P * n;
    const estimatedReturns = futureValue - totalInvested;

    return ApiResponse.ok({
      totalInvestment: DecimalUtils.round(totalInvested),
      totalInvested: DecimalUtils.round(totalInvested),
      estimatedReturns: DecimalUtils.round(estimatedReturns),
      wealthGained: DecimalUtils.round(estimatedReturns),
      totalValue: DecimalUtils.round(futureValue),
      monthlyInvestment: P,
      investmentYears: years,
      expectedReturnRate: rate,
    }, 'SIP calculation completed successfully');
  }

  /** 5b. Lumpsum Investment Calculator */
  calculateLumpsum(dto: any) {
    const P = dto.investmentAmount ?? dto.principal ?? 0;
    const rate = dto.expectedReturnRate ?? dto.annualRate ?? 0;
    const years = dto.tenureYears ?? dto.years ?? 0;

    const futureValue = P * Math.pow(1 + rate / 100, years);
    const estimatedReturns = futureValue - P;

    return ApiResponse.ok({
      totalInvestment: DecimalUtils.round(P),
      estimatedReturns: DecimalUtils.round(estimatedReturns),
      totalValue: DecimalUtils.round(futureValue),
    }, 'Lumpsum calculation completed successfully');
  }

  /** 5c. Inflation Calculator */
  calculateInflation(dto: any) {
    const currentAmount = dto.currentAmount ?? 0;
    const rate = dto.inflationRate ?? 0;
    const years = dto.years ?? 0;

    const futureAmount = currentAmount * Math.pow(1 + rate / 100, years);
    const inflationImpact = futureAmount - currentAmount;

    return ApiResponse.ok({
      currentAmount,
      futureAmount: DecimalUtils.round(futureAmount),
      inflationImpact: DecimalUtils.round(inflationImpact),
      years,
      inflationRate: rate,
    }, 'Inflation calculation completed successfully');
  }

  /** 6. TVM / Present & Future Value Calculator */
  calculateTvm(dto: TvmDto) {
    const r = dto.annualRate / 100;
    const n = dto.periods;

    if (dto.presentValue !== undefined && dto.presentValue !== null) {
      const fv = dto.presentValue * Math.pow(1 + r, n);
      return ApiResponse.ok({
        presentValue: dto.presentValue,
        futureValue: DecimalUtils.round(fv),
        rate: dto.annualRate,
        periods: n,
      });
    } else if (dto.futureValue !== undefined && dto.futureValue !== null) {
      const pv = dto.futureValue / Math.pow(1 + r, n);
      return ApiResponse.ok({
        presentValue: DecimalUtils.round(pv),
        futureValue: dto.futureValue,
        rate: dto.annualRate,
        periods: n,
      });
    }

    return ApiResponse.fail('Either presentValue or futureValue must be provided');
  }

  /** 7. Progressive Tax Estimator */
  calculateTax(dto: any) {
    const income = dto.annualIncome ?? dto.grossIncome ?? 0;
    const deductions = dto.deductions ?? (dto.filingStatus === 'MARRIED_JOINT' ? 27700 : 13850);
    const taxableIncome = Math.max(0, income - deductions);

    // US Progressive Brackets
    const brackets = [
      { cap: 11600, rate: 0.10 },
      { cap: 47150, rate: 0.12 },
      { cap: 100525, rate: 0.22 },
      { cap: 191950, rate: 0.24 },
      { cap: 243725, rate: 0.32 },
      { cap: 609350, rate: 0.35 },
      { cap: Infinity, rate: 0.37 },
    ];

    let totalTax = 0;
    let prevCap = 0;

    for (const b of brackets) {
      if (taxableIncome > prevCap) {
        const taxableInBracket = Math.min(taxableIncome - prevCap, b.cap - prevCap);
        totalTax += taxableInBracket * b.rate;
        prevCap = b.cap;
      } else {
        break;
      }
    }

    const effectiveTaxRate = income > 0 ? (totalTax / income) * 100 : 0;

    return ApiResponse.ok({
      annualIncome: income,
      grossIncome: income,
      deductions,
      taxableIncome: DecimalUtils.round(taxableIncome),
      totalEstimatedTax: DecimalUtils.round(totalTax),
      effectiveTaxRate: DecimalUtils.round(effectiveTaxRate, 2),
      afterTaxIncome: DecimalUtils.round(income - totalTax),
    }, 'Tax estimate calculated successfully');
  }
}
