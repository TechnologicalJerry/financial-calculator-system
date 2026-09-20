import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

export interface SipRequest {
  monthlyInvestment: number;
  expectedReturnRate: number;
  tenureYears: number;
}

export interface SipResult {
  totalInvestment: number;
  estimatedReturns: number;
  totalValue: number;
  yearlyBreakdown?: Array<{
    year: number;
    investedAmount: number;
    estimatedReturns: number;
    totalValue: number;
  }>;
}

export interface LumpsumRequest {
  investmentAmount: number;
  expectedReturnRate: number;
  tenureYears: number;
}

export interface LumpsumResult {
  totalInvestment: number;
  estimatedReturns: number;
  totalValue: number;
}

export interface LoanAmortizationRequest {
  loanAmount: number;
  interestRate: number;
  tenureYears: number;
}

export interface LoanAmortizationResult {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  schedule?: Array<{
    month: number;
    principalPaid: number;
    interestPaid: number;
    remainingBalance: number;
  }>;
}

export interface MortgageRequest {
  homeValue: number;
  downPayment: number;
  interestRate: number;
  tenureYears: number;
  propertyTaxRate?: number;
  homeInsurance?: number;
}

export interface MortgageResult {
  loanAmount: number;
  monthlyPayment: number;
  principalAndInterest: number;
  taxAndInsuranceMonthly: number;
  totalCost: number;
}

export interface FireRequest {
  currentAge: number;
  targetRetirementAge: number;
  currentAnnualExpense: number;
  expectedInflationRate: number;
  safeWithdrawalRate?: number;
}

export interface FireResult {
  fireNumber: number;
  yearsToRetirement: number;
  futureAnnualExpense: number;
  requiredMonthlySavings: number;
}

export interface TvmRequest {
  presentValue?: number;
  futureValue?: number;
  periods?: number;
  interestRate?: number;
  payment?: number;
}

export interface InflationRequest {
  currentAmount: number;
  inflationRate: number;
  years: number;
}

export interface TaxRequest {
  annualIncome: number;
  deductions?: number;
  taxRegime?: 'OLD' | 'NEW';
}

export const calculatorService = {
  async calculateSip(data: SipRequest): Promise<ApiResponse<SipResult>> {
    const res = await apiClient.post<ApiResponse<SipResult>>('/api/v1/calculator/sip', data);
    return res.data;
  },

  async calculateLumpsum(data: LumpsumRequest): Promise<ApiResponse<LumpsumResult>> {
    const res = await apiClient.post<ApiResponse<LumpsumResult>>('/api/v1/calculator/lumpsum', data);
    return res.data;
  },

  async calculateLoanAmortization(data: LoanAmortizationRequest): Promise<ApiResponse<LoanAmortizationResult>> {
    const res = await apiClient.post<ApiResponse<LoanAmortizationResult>>('/api/v1/calculator/loan-amortization', data);
    return res.data;
  },

  async calculateMortgage(data: MortgageRequest): Promise<ApiResponse<MortgageResult>> {
    const res = await apiClient.post<ApiResponse<MortgageResult>>('/api/v1/calculator/mortgage', data);
    return res.data;
  },

  async calculateFire(data: FireRequest): Promise<ApiResponse<FireResult>> {
    const res = await apiClient.post<ApiResponse<FireResult>>('/api/v1/calculator/fire', data);
    return res.data;
  },

  async calculateTvm(data: TvmRequest): Promise<ApiResponse<unknown>> {
    const res = await apiClient.post<ApiResponse<unknown>>('/api/v1/calculator/tvm', data);
    return res.data;
  },

  async calculateInflation(data: InflationRequest): Promise<ApiResponse<unknown>> {
    const res = await apiClient.post<ApiResponse<unknown>>('/api/v1/calculator/inflation', data);
    return res.data;
  },

  async calculateTax(data: TaxRequest): Promise<ApiResponse<unknown>> {
    const res = await apiClient.post<ApiResponse<unknown>>('/api/v1/calculator/tax', data);
    return res.data;
  },
};
