import {
  CompoundInterestCalculator,
  SimpleInterestCalculator,
  LoanCalculator,
  MortgageCalculator,
  InvestmentCalculator,
  SavingsCalculator,
  RetirementCalculator,
  CalculatorRegistry,
  CalculatorService,
} from '@packages/calculators';
import { ValidationError, CalculatorNotFoundError } from '@packages/errors';

describe('Financial Calculators Unit Tests', () => {
  describe('CompoundInterestCalculator', () => {
    const calc = new CompoundInterestCalculator();

    it('should calculate compound interest correctly (ANNUALLY)', () => {
      const result = calc.calculate({
        principal: 1000,
        annualRate: 5,
        term: 2,
        termUnit: 'YEARS',
        compoundingFrequency: 'ANNUALLY',
        currency: 'USD',
      });

      expect(result.principal).toBe('1000.00');
      expect(result.finalAmount).toBe('1102.50'); // 1000 * 1.05^2 = 1102.5
      expect(result.interestEarned).toBe('102.50');
    });

    it('should calculate continuous compounding correctly', () => {
      const result = calc.calculate({
        principal: 1000,
        annualRate: 5,
        term: 1,
        termUnit: 'YEARS',
        compoundingFrequency: 'CONTINUOUS',
        currency: 'USD',
      });

      // 1000 * e^0.05 ≈ 1051.27
      expect(result.finalAmount).toBe('1051.27');
    });

    it('should reject invalid zero or negative principal', () => {
      expect(() =>
        calc.validateInput({
          principal: 0,
          annualRate: 5,
          term: 1,
          termUnit: 'YEARS',
        }),
      ).toThrow(ValidationError);

      expect(() =>
        calc.validateInput({
          principal: -500,
          annualRate: 5,
          term: 1,
          termUnit: 'YEARS',
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('SimpleInterestCalculator', () => {
    const calc = new SimpleInterestCalculator();

    it('should calculate simple interest correctly', () => {
      const result = calc.calculate({
        principal: 1000,
        annualRate: 5,
        term: 3,
        termUnit: 'YEARS',
        currency: 'USD',
      });

      expect(result.principal).toBe('1000.00');
      expect(result.interestEarned).toBe('150.00'); // 1000 * 0.05 * 3 = 150
      expect(result.finalAmount).toBe('1150.00');
    });
  });

  describe('LoanCalculator', () => {
    const calc = new LoanCalculator();

    it('should calculate periodic loan payment and schedule', () => {
      const result = calc.calculate({
        principal: 10000,
        annualInterestRate: 6,
        term: 1,
        termUnit: 'YEARS',
        paymentFrequency: 'MONTHLY',
        currency: 'USD',
      });

      expect(result.numberOfPayments).toBe(12);
      expect(result.periodicPayment).toBe('860.66');
      expect(result.totalPrincipal).toBe('10000.00');
      expect(result.schedule?.length).toBe(12);
      expect(result.schedule?.[11]?.remainingBalance).toBe('0.00');
    });

    it('should handle zero interest loan', () => {
      const result = calc.calculate({
        principal: 12000,
        annualInterestRate: 0,
        term: 1,
        termUnit: 'YEARS',
        paymentFrequency: 'MONTHLY',
        currency: 'USD',
      });

      expect(result.periodicPayment).toBe('1000.00');
      expect(result.totalInterest).toBe('0.00');
      expect(result.totalPayments).toBe('12000.00');
    });
  });

  describe('MortgageCalculator', () => {
    const calc = new MortgageCalculator();

    it('should calculate mortgage payment with down payment and taxes/insurance', () => {
      const input = calc.validateInput({
        homePrice: 300000,
        downPayment: 60000, // 20% down
        annualInterestRate: 5,
        loanTerm: 30,
        paymentFrequency: 'MONTHLY',
        propertyTax: 3600, // 300/mo
        homeInsurance: 1200, // 100/mo
        currency: 'USD',
      });
      const result = calc.calculate(input);

      expect(result.loanAmount).toBe('240000.00');
      expect(result.periodicPrincipalAndInterest).toBe('1288.37');
      expect(result.estimatedTaxes).toBe('300.00');
      expect(result.estimatedInsurance).toBe('100.00');
      expect(result.totalPeriodicPayment).toBe('1688.37');
    });

    it('should reject down payment greater than home price', () => {
      expect(() =>
        calc.validateInput({
          homePrice: 200000,
          downPayment: 250000,
          annualInterestRate: 4,
          loanTerm: 30,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('InvestmentCalculator', () => {
    const calc = new InvestmentCalculator();

    it('should calculate investment growth with monthly contributions', () => {
      const result = calc.calculate({
        initialInvestment: 5000,
        periodicContribution: 200,
        annualReturnRate: 8,
        term: 5,
        termUnit: 'YEARS',
        contributionFrequency: 'MONTHLY',
        compoundingFrequency: 'ANNUALLY',
        currency: 'USD',
      });

      expect(result.initialInvestment).toBe('5000.00');
      expect(result.totalContributions).toBe('12000.00');
      expect(result.totalInvested).toBe('17000.00');
      expect(Number(result.finalValue)).toBeGreaterThan(17000);
    });
  });

  describe('SavingsCalculator', () => {
    const calc = new SavingsCalculator();

    it('should calculate savings growth with interest and deposits', () => {
      const result = calc.calculate({
        initialSavings: 1000,
        periodicContribution: 100,
        annualInterestRate: 3,
        term: 1,
        termUnit: 'YEARS',
        contributionFrequency: 'MONTHLY',
        compoundingFrequency: 'MONTHLY',
        currency: 'USD',
      });

      expect(result.totalDeposited).toBe('2200.00'); // 1000 + 1200
      expect(Number(result.finalBalance)).toBeGreaterThan(2200);
    });

    it('should handle zero interest savings', () => {
      const result = calc.calculate({
        initialSavings: 1000,
        periodicContribution: 100,
        annualInterestRate: 0,
        term: 1,
        termUnit: 'YEARS',
        contributionFrequency: 'MONTHLY',
        compoundingFrequency: 'MONTHLY',
        currency: 'USD',
      });

      expect(result.finalBalance).toBe('2200.00');
      expect(result.interestEarned).toBe('0.00');
    });
  });

  describe('RetirementCalculator', () => {
    const calc = new RetirementCalculator();

    it('should project retirement savings and inflation adjusted purchasing power', () => {
      const input = calc.validateInput({
        currentAge: 30,
        retirementAge: 65,
        currentSavings: 10000,
        monthlyContribution: 500,
        expectedAnnualReturn: 7,
        expectedAnnualInflation: 2.5,
        currency: 'USD',
      });
      const result = calc.calculate(input);

      expect(result.yearsUntilRetirement).toBe(35);
      expect(Number(result.projectedRetirementSavings)).toBeGreaterThan(220000);
      expect(Number(result.inflationAdjustedValue)).toBeLessThan(Number(result.projectedRetirementSavings));
      expect(result.assumptions.length).toBeGreaterThan(0);
    });

    it('should reject retirementAge less than or equal to currentAge', () => {
      expect(() =>
        calc.validateInput({
          currentAge: 40,
          retirementAge: 35,
          currentSavings: 1000,
          monthlyContribution: 100,
          expectedAnnualReturn: 5,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('CalculatorRegistry & CalculatorService', () => {
    it('should list all registered calculators', () => {
      const registry = CalculatorRegistry.getInstance();
      const list = registry.list();
      expect(list.length).toBe(7);
      const ids = list.map((c) => c.id);
      expect(ids).toContain('compound-interest');
      expect(ids).toContain('simple-interest');
      expect(ids).toContain('loan');
      expect(ids).toContain('mortgage');
      expect(ids).toContain('investment');
      expect(ids).toContain('savings');
      expect(ids).toContain('retirement');
    });

    it('should throw CalculatorNotFoundError for invalid calculator ID', () => {
      const service = new CalculatorService();
      expect(() => service.getCalculatorMetadata('unknown-calculator')).toThrow(CalculatorNotFoundError);
      expect(() => service.calculate('unknown-calculator', {})).toThrow(CalculatorNotFoundError);
    });
  });
});
