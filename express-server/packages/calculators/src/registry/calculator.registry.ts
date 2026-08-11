import { CalculatorNotFoundError } from '@packages/errors';
import { ICalculator, CalculatorMetadata } from '../types/calculator.types.js';
import { CompoundInterestCalculator } from '../calculators/compound-interest.calculator.js';
import { SimpleInterestCalculator } from '../calculators/simple-interest.calculator.js';
import { LoanCalculator } from '../calculators/loan.calculator.js';
import { MortgageCalculator } from '../calculators/mortgage.calculator.js';
import { InvestmentCalculator } from '../calculators/investment.calculator.js';
import { SavingsCalculator } from '../calculators/savings.calculator.js';
import { RetirementCalculator } from '../calculators/retirement.calculator.js';

export class CalculatorRegistry {
  private static instance: CalculatorRegistry;
  private calculators = new Map<string, ICalculator>();

  constructor() {
    this.registerDefaults();
  }

  public static getInstance(): CalculatorRegistry {
    if (!CalculatorRegistry.instance) {
      CalculatorRegistry.instance = new CalculatorRegistry();
    }
    return CalculatorRegistry.instance;
  }

  public register(calculator: ICalculator): void {
    this.calculators.set(calculator.metadata.id, calculator);
  }

  public get(calculatorId: string): ICalculator {
    const calculator = this.calculators.get(calculatorId);
    if (!calculator) {
      throw new CalculatorNotFoundError(calculatorId);
    }
    return calculator;
  }

  public has(calculatorId: string): boolean {
    return this.calculators.has(calculatorId);
  }

  public list(): CalculatorMetadata[] {
    return Array.from(this.calculators.values()).map((calc) => calc.metadata);
  }

  private registerDefaults(): void {
    this.register(new CompoundInterestCalculator());
    this.register(new SimpleInterestCalculator());
    this.register(new LoanCalculator());
    this.register(new MortgageCalculator());
    this.register(new InvestmentCalculator());
    this.register(new SavingsCalculator());
    this.register(new RetirementCalculator());
  }
}

export const calculatorRegistry = CalculatorRegistry.getInstance();
